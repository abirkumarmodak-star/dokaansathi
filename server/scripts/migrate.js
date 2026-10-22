"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { assertDatabaseConfiguration } = require("../config/databaseIsolation");

const TARGET_DATABASE = "purulia_dhaba_db";
const HISTORY_TABLE = "schema_migrations";
const LOCK_NAME = "purulia_dhaba_db_schema_migrations";

// Matching DATABASE() verifies the selected schema name only. It does not prove
// that this is a distinct MySQL server or that the account lacks grants elsewhere.
// Deployment must separately establish host identity and database-scoped grants.

const MIGRATION_OBJECTS = Object.freeze({
    "0001": ["schema_migrations"],
    "0002": ["users", "staff", "customers", "shop_settings", "shop_status", "whatsapp_settings"],
    "0003": ["menu", "inventory", "combos", "restaurant_tables"],
    "0004": ["orders", "order_items"],
    "0005": ["delivery_assignments", "delivery_assignment_attempts", "push_subscriptions"],
    "0006": ["alerts", "reviews"],
    "0007": ["order_tracking_capabilities"]
});

function validateTargetConfiguration(env = process.env) {
    const configuredName = assertDatabaseConfiguration(env);

    if (
        configuredName !== TARGET_DATABASE ||
        env.DB_NAME !== TARGET_DATABASE
    ) {
        throw new Error("Migration requires the exact Purulia Dhaba database name.");
    }

    return TARGET_DATABASE;
}

function checksum(content) {
    return crypto.createHash("sha256").update(content, "utf8").digest("hex");
}

function splitSqlStatements(sql) {
    const statements = [];
    let current = "";
    let quote = null;
    let lineComment = false;
    let blockComment = false;

    for (let i = 0; i < sql.length; i += 1) {
        const char = sql[i];
        const next = sql[i + 1];

        if (lineComment) {
            if (char === "\n") {
                lineComment = false;
                current += "\n";
            }
            continue;
        }

        if (blockComment) {
            if (char === "*" && next === "/") {
                blockComment = false;
                i += 1;
            }
            continue;
        }

        if (quote) {
            current += char;
            if (char === "\\" && next) {
                current += next;
                i += 1;
            } else if (char === quote) {
                if (next === quote) {
                    current += next;
                    i += 1;
                } else {
                    quote = null;
                }
            }
            continue;
        }

        if (char === "'" || char === '"' || char === "`") {
            quote = char;
            current += char;
            continue;
        }

        if (char === "-" && next === "-" && (i + 2 === sql.length || /\s/.test(sql[i + 2]))) {
            lineComment = true;
            i += 1;
            continue;
        }

        if (char === "#") {
            lineComment = true;
            continue;
        }

        if (char === "/" && next === "*") {
            blockComment = true;
            i += 1;
            continue;
        }

        if (char === ";") {
            if (current.trim()) statements.push(current.trim());
            current = "";
            continue;
        }

        current += char;
    }

    if (quote || blockComment) {
        throw new Error("Migration SQL contains an unterminated string or comment.");
    }

    if (current.trim()) statements.push(current.trim());
    return statements;
}

function loadMigrations(directory = path.resolve(__dirname, "../migrations")) {
    const files = fs.readdirSync(directory)
        .filter((name) => name.endsWith(".sql"))
        .sort();

    if (files.length !== Object.keys(MIGRATION_OBJECTS).length) {
        throw new Error("Migration directory is incomplete; refusing to run a partial migration set.");
    }

    return files.map((name, index) => {
        const match = /^(\d{4})_[a-z0-9_]+\.sql$/i.exec(name);
        if (!match || !MIGRATION_OBJECTS[match[1]]) {
            throw new Error("Migration directory contains an unrecognized migration file.");
        }

        const expectedVersion = String(index + 1).padStart(4, "0");
        if (match[1] !== expectedVersion) {
            throw new Error("Migration versions must be contiguous and ordered from 0001.");
        }

        const sql = fs.readFileSync(path.join(directory, name), "utf8");
        return {
            version: match[1],
            name,
            sql,
            checksum: checksum(sql),
            objects: MIGRATION_OBJECTS[match[1]]
        };
    });
}

function query(connection, sql, parameters = []) {
    return new Promise((resolve, reject) => {
        try {
            connection.query(sql, parameters, (error, rows) => {
                if (error) {
                    reject(new Error("A migration database operation failed."));
                    return;
                }
                resolve(rows);
            });
        } catch {
            reject(new Error("A migration database operation failed."));
        }
    });
}

function acquireConnection(db) {
    return new Promise((resolve, reject) => {
        try {
            db.getConnection((error, connection) => {
                if (error || !connection) {
                    reject(new Error("Could not acquire a guarded migration connection."));
                    return;
                }
                resolve(connection);
            });
        } catch {
            reject(new Error("Could not acquire a guarded migration connection."));
        }
    });
}

async function verifyHeldConnection(connection) {
    const rows = await query(connection, "SELECT DATABASE() AS database_name");
    if (!rows || !rows[0] || rows[0].database_name !== TARGET_DATABASE) {
        throw new Error("Held migration connection did not match the target database.");
    }
}

async function acquireMigrationLock(connection, lockState) {
    // A query error can arrive after MySQL granted the lock. Treat any outcome
    // without an explicit 0/1 response as ambiguous and quarantine the session.
    lockState.attempted = true;
    const rows = await query(connection, "SELECT GET_LOCK(?, 0) AS lock_acquired", [LOCK_NAME]);
    if (!rows || !rows[0]) {
        throw new Error("Migration lock acquisition outcome is uncertain.");
    }

    const result = Number(rows[0].lock_acquired);
    if (result === 0) {
        lockState.attempted = false;
        throw new Error("Another migration runner holds the database migration lock.");
    }

    if (result !== 1) {
        throw new Error("Migration lock acquisition outcome is uncertain.");
    }

    lockState.held = true;
}

async function releaseMigrationLock(connection) {
    const rows = await query(connection, "SELECT RELEASE_LOCK(?) AS lock_released", [LOCK_NAME]);
    if (!rows || !rows[0] || Number(rows[0].lock_released) !== 1) {
        throw new Error("Migration lock release could not be confirmed.");
    }
}

function destroyPhysicalConnection(connection) {
    if (typeof connection.destroy !== "function") {
        throw new Error("The physical migration connection cannot be safely destroyed.");
    }
    connection.destroy();
}

function reportCleanupFailure(primaryError, cleanupMessage, logger) {
    const cleanupError = cleanupMessage instanceof Error
        ? cleanupMessage
        : new Error(cleanupMessage);
    try {
        logger.error("Migration cleanup failed; the connection was quarantined.", cleanupError);
    } catch { /* Diagnostics must not replace the migration or cleanup error. */ }
    if (primaryError) {
        primaryError.cleanupError = cleanupError;
        return;
    }
    throw cleanupError;
}

async function tableExists(connection, tableName) {
    const rows = await query(
        connection,
        "SELECT TABLE_NAME FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?",
        [tableName]
    );
    return Boolean(rows && rows.length);
}

async function listTables(connection) {
    const rows = await query(
        connection,
        "SELECT TABLE_NAME FROM information_schema.tables WHERE table_schema = DATABASE()"
    );
    return (rows || []).map((row) => row.TABLE_NAME || row.table_name);
}

function normalizeCreateStatement(createStatement) {
    return String(createStatement)
        .replace(/\s+AUTO_INCREMENT\s*=\s*\d+/gi, "")
        .replace(/\s+/g, " ")
        .trim();
}

async function schemaFingerprint(connection, objectNames) {
    const definitions = [];
    for (const objectName of objectNames) {
        if (!/^[a-z0-9_]+$/i.test(objectName)) {
            throw new Error("Migration manifest contains an invalid object name.");
        }
        const rows = await query(connection, `SHOW CREATE TABLE \`${objectName}\``);
        const row = rows && rows[0];
        if (!row) throw new Error("Schema reconciliation is required: an expected table is missing.");
        const key = Object.keys(row).find((column) => /^Create Table$/i.test(column));
        const definition = key ? row[key] : Object.values(row)[1];
        if (typeof definition !== "string") {
            throw new Error("Schema reconciliation is required: table definition could not be read.");
        }
        definitions.push(`${objectName}\n${normalizeCreateStatement(definition)}`);
    }
    return checksum(definitions.join("\n"));
}

function validateMigrationList(migrations) {
    if (!Array.isArray(migrations) || migrations.length === 0) {
        throw new Error("No migration files were found.");
    }
    migrations.forEach((migration, index) => {
        const expectedVersion = String(index + 1).padStart(4, "0");
        if (
            migration.version !== expectedVersion ||
            !migration.name ||
            typeof migration.sql !== "string" ||
            !Array.isArray(migration.objects) ||
            migration.objects.length === 0
        ) {
            throw new Error("Migration list is incomplete or out of order.");
        }
    });
}

async function executeMigrationSql(connection, migration) {
    const statements = splitSqlStatements(migration.sql);
    if (!statements.length) throw new Error("Migration file contains no SQL statements.");
    for (const statement of statements) {
        await query(connection, statement);
    }
}

async function recordMigration(connection, migration, fingerprint) {
    await query(
        connection,
        "INSERT INTO schema_migrations (version, name, checksum, schema_fingerprint) VALUES (?, ?, ?, ?)",
        [migration.version, migration.name, migration.checksum || checksum(migration.sql), fingerprint]
    );
}

async function runMigrations({ db, env = process.env, migrations = loadMigrations(), logger = console }) {
    validateTargetConfiguration(env);
    validateMigrationList(migrations);

    const connection = await acquireConnection(db);
    const lockState = { attempted: false, held: false };
    let primaryError;
    try {
        // The facade gates acquisition; this second identity check is deliberately
        // performed on the exact connection that will execute all migration SQL.
        await verifyHeldConnection(connection);
        await acquireMigrationLock(connection, lockState);

        const historyExists = await tableExists(connection, HISTORY_TABLE);
        let history = [];

        if (!historyExists) {
            const existingTables = await listTables(connection);
            if (existingTables.length) {
                throw new Error("Untracked schema found; migration reconciliation is required.");
            }

            const first = migrations[0];
            if (first.version !== "0001" || !first.objects.includes(HISTORY_TABLE)) {
                throw new Error("The migration history bootstrap is missing or invalid.");
            }

            try {
                await executeMigrationSql(connection, first);
                const fingerprint = await schemaFingerprint(connection, first.objects);
                await recordMigration(connection, first, fingerprint);
                history = [{
                    version: first.version,
                    name: first.name,
                    checksum: first.checksum || checksum(first.sql),
                    schema_fingerprint: fingerprint
                }];
            } catch {
                throw new Error("Migration 0001 failed or partially applied; schema reconciliation is required.");
            }
        } else {
            history = await query(
                connection,
                "SELECT version, name, checksum, schema_fingerprint FROM schema_migrations ORDER BY version"
            );
            if (!history || !history.some((row) => row.version === "0001")) {
                throw new Error("Migration history exists without its bootstrap record; reconciliation is required.");
            }
        }

        const knownObjects = new Set(migrations.flatMap((migration) => migration.objects));
        const unexpectedTables = (await listTables(connection))
            .filter((tableName) => !knownObjects.has(tableName));
        if (unexpectedTables.length) {
            throw new Error("Unexpected database objects found; schema reconciliation is required.");
        }

        const migrationsByVersion = new Map(migrations.map((item) => [item.version, item]));
        for (const record of history) {
            const migration = migrationsByVersion.get(record.version);
            if (!migration) throw new Error("Migration history contains an unknown version; reconciliation is required.");
            const currentChecksum = migration.checksum || checksum(migration.sql);
            if (record.name !== migration.name || record.checksum !== currentChecksum) {
                throw new Error(`Migration ${record.version} checksum or name changed; refusing to continue.`);
            }
            const actualFingerprint = await schemaFingerprint(connection, migration.objects);
            if (record.schema_fingerprint !== actualFingerprint) {
                throw new Error(`Migration ${record.version} schema drift detected; reconciliation is required.`);
            }
        }

        const appliedVersions = new Set(history.map((row) => row.version));
        for (const migration of migrations) {
            if (appliedVersions.has(migration.version)) continue;

            const presentObjects = [];
            for (const objectName of migration.objects) {
                if (await tableExists(connection, objectName)) presentObjects.push(objectName);
            }
            if (presentObjects.length) {
                throw new Error(`Migration ${migration.version} has pre-existing objects; schema reconciliation is required.`);
            }

            try {
                await executeMigrationSql(connection, migration);
                const fingerprint = await schemaFingerprint(connection, migration.objects);
                await recordMigration(connection, migration, fingerprint);
                appliedVersions.add(migration.version);
            } catch {
                throw new Error(`Migration ${migration.version} failed or partially applied; schema reconciliation is required.`);
            }
        }

        logger.log("Purulia Dhaba migrations are up to date.");
        return { appliedVersions: [...appliedVersions].sort() };
    } catch (error) {
        primaryError = error;
        throw error;
    } finally {
        let mustDestroy = lockState.attempted;
        let cleanupMessage = mustDestroy
            ? new Error("Migration lock state is uncertain; the physical connection was destroyed.")
            : null;

        if (lockState.held) {
            try {
                await releaseMigrationLock(connection);
                lockState.held = false;
                lockState.attempted = false;
                mustDestroy = false;
                cleanupMessage = null;
            } catch (error) {
                mustDestroy = true;
                cleanupMessage = new Error("Migration lock release failed; the physical connection was destroyed.", { cause: error });
            }
        }

        if (mustDestroy) {
            try {
                destroyPhysicalConnection(connection);
            } catch (error) {
                cleanupMessage = new Error("Migration lock cleanup and physical connection destruction both failed; the connection was not returned to the pool.", { cause: error });
            }
        } else {
            try {
                connection.release();
            } catch (releaseError) {
                try {
                    destroyPhysicalConnection(connection);
                    cleanupMessage = new Error("Connection release failed; the physical connection was destroyed.", { cause: releaseError });
                } catch (destroyError) {
                    cleanupMessage = new Error("Connection release and physical connection destruction both failed; the connection was not returned to the pool.", { cause: new AggregateError([releaseError, destroyError]) });
                }
            }
        }

        if (cleanupMessage) {
            reportCleanupFailure(primaryError, cleanupMessage, logger);
        }
    }
}

function loadRuntimeConfiguration() {
    require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
    validateTargetConfiguration(process.env);
}

async function main() {
    loadRuntimeConfiguration();
    // Requiring db.js creates only the guarded pool. No connection is acquired
    // until runMigrations has validated configuration and begins its guarded flow.
    const db = require("../config/db");
    try {
        await runMigrations({ db, env: process.env, migrations: loadMigrations() });
    } finally {
        await new Promise((resolve) => {
            try { db.end(() => resolve()); } catch { resolve(); }
        });
    }
}

if (require.main === module) {
    main().catch((error) => {
        const message = error && typeof error.message === "string"
            ? error.message
            : "Migration failed safely.";
        console.error(`Migration stopped: ${message}`);
        process.exitCode = 1;
    });
}

module.exports = {
    TARGET_DATABASE,
    MIGRATION_OBJECTS,
    validateTargetConfiguration,
    checksum,
    splitSqlStatements,
    loadMigrations,
    normalizeCreateStatement,
    schemaFingerprint,
    runMigrations
};
