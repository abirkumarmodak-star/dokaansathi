"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
    TARGET_DATABASE,
    validateTargetConfiguration,
    splitSqlStatements,
    runMigrations
} = require("../scripts/migrate");

const validEnv = {
    DB_NAME: TARGET_DATABASE,
    PURULIA_EXPECTED_DB_NAME: TARGET_DATABASE
};

function smallMigrations(secondSql = "CREATE TABLE sample (id INT NOT NULL);") {
    return [
        {
            version: "0001",
            name: "0001_create_migration_history.sql",
            sql: "CREATE TABLE schema_migrations (version VARCHAR(16) PRIMARY KEY, name VARCHAR(255), checksum CHAR(64), schema_fingerprint CHAR(64), applied_at TIMESTAMP);",
            objects: ["schema_migrations"]
        },
        {
            version: "0002",
            name: "0002_sample.sql",
            sql: secondSql,
            objects: ["sample"]
        }
    ];
}

class FakeDatabase {
    constructor(options = {}) {
        this.options = options;
        this.tables = new Map();
        this.history = [];
        this.locked = false;
        this.nextConnectionId = 1;
        this.events = [];
        this.connections = [];
        this.ddlFailureConsumed = false;
    }

    getConnection(callback) {
        if (this.options.failAcquire) {
            queueMicrotask(() => callback(new Error("fake acquisition error")));
            return;
        }
        const connection = new FakeConnection(this, this.nextConnectionId++);
        this.connections.push(connection);
        queueMicrotask(() => callback(null, connection));
    }
}

class FakeConnection {
    constructor(database, id) {
        this.database = database;
        this.id = id;
        this.identityVerified = false;
        this.released = false;
    }

    query(sql, parameters, callback) {
        const db = this.database;
        const normalizedSql = sql.trim();
        db.events.push({ connectionId: this.id, sql: normalizedSql });

        const respond = (error, rows = []) => callback(error, rows);
        const asyncRespond = (error, rows = []) => queueMicrotask(() => respond(error, rows));

        if (/^SELECT DATABASE\(\) AS database_name$/i.test(normalizedSql)) {
            if (db.options.failIdentity) return asyncRespond(new Error("fake identity error"));
            const name = db.options.actualDatabase || TARGET_DATABASE;
            if (name === TARGET_DATABASE) this.identityVerified = true;
            return asyncRespond(null, [{ database_name: name }]);
        }

        if (/^SELECT GET_LOCK\(/i.test(normalizedSql)) {
            if (db.options.failLockAfterGrant) {
                db.locked = true;
                this.ownsLock = true;
                return asyncRespond(new Error("ambiguous lock response"));
            }
            const acquire = () => {
                if (db.locked) return respond(null, [{ lock_acquired: 0 }]);
                db.locked = true;
                this.ownsLock = true;
                respond(null, [{ lock_acquired: 1 }]);
            };
            if (db.options.delayFirstLock && !db.options.firstLockDelayed) {
                db.options.firstLockDelayed = true;
                db.locked = true;
                this.ownsLock = true;
                setTimeout(() => respond(null, [{ lock_acquired: 1 }]), 25);
                return;
            }
            return asyncRespond(null, [{ lock_acquired: db.locked ? 0 : 1 }].map((row) => {
                if (row.lock_acquired === 1) {
                    db.locked = true;
                    this.ownsLock = true;
                }
                return row;
            }));
        }

        if (/^SELECT RELEASE_LOCK\(/i.test(normalizedSql)) {
            if (db.options.failRelease) return asyncRespond(new Error("ambiguous release response"));
            if (this.ownsLock) db.locked = false;
            this.ownsLock = false;
            return asyncRespond(null, [{ lock_released: 1 }]);
        }

        if (/^SELECT TABLE_NAME FROM information_schema\.tables/i.test(normalizedSql)) {
            if (/table_name\s*=\s*\?/i.test(normalizedSql)) {
                const exists = db.tables.has(parameters[0]);
                return asyncRespond(null, exists ? [{ TABLE_NAME: parameters[0] }] : []);
            }
            return asyncRespond(null, [...db.tables.keys()].map((TABLE_NAME) => ({ TABLE_NAME })));
        }

        if (/^SELECT version, name, checksum, schema_fingerprint FROM schema_migrations/i.test(normalizedSql)) {
            return asyncRespond(null, db.history.map((row) => ({ ...row })));
        }

        const showCreate = /^SHOW CREATE TABLE `([a-z0-9_]+)`$/i.exec(normalizedSql);
        if (showCreate) {
            const definition = db.tables.get(showCreate[1]);
            return asyncRespond(null, definition
                ? [{ Table: showCreate[1], "Create Table": definition }]
                : []);
        }

        const createTable = /^CREATE TABLE\s+`?([a-z0-9_]+)`?/i.exec(normalizedSql);
        if (createTable) {
            if (!this.identityVerified) return asyncRespond(new Error("DDL before identity check"));
            const name = createTable[1];
            db.tables.set(name, normalizedSql);
            db.events.push({ connectionId: this.id, ddl: name });
            return asyncRespond(null, [{ affectedRows: 0 }]);
        }

        if (/^INSERT INTO schema_migrations/i.test(normalizedSql)) {
            const [version, name, checksum, schema_fingerprint] = parameters;
            db.history.push({ version, name, checksum, schema_fingerprint });
            return asyncRespond(null, [{ affectedRows: 1 }]);
        }

        if (db.options.failOnSql && normalizedSql.includes(db.options.failOnSql) && !db.ddlFailureConsumed) {
            db.ddlFailureConsumed = true;
            return asyncRespond(new Error("fake SQL failure"));
        }

        if (/^(INSERT|UPDATE|DELETE)\s/i.test(normalizedSql) && !this.identityVerified) {
            return asyncRespond(new Error("write before identity check"));
        }
        return asyncRespond(null, [{ affectedRows: 1 }]);
    }

    release() {
        this.released = true;
        this.releaseCount = (this.releaseCount || 0) + 1;
        if (this.ownsLock) this.database.locked = false;
    }

    destroy() {
        this.destroyed = true;
        if (this.database.options.failDestroy) throw new Error("fake destroy failure");
        if (this.ownsLock) this.database.locked = false;
    }
}

function quietLogger() {
    return { log() {} };
}

test("target configuration requires the exact Purulia name", () => {
    assert.equal(validateTargetConfiguration(validEnv), TARGET_DATABASE);
    assert.throws(() => validateTargetConfiguration({}), /required/);
    assert.throws(() => validateTargetConfiguration({
        DB_NAME: "other_db",
        PURULIA_EXPECTED_DB_NAME: "other_db"
    }), /exact Purulia/);
    assert.throws(() => validateTargetConfiguration({
        DB_NAME: TARGET_DATABASE,
        PURULIA_EXPECTED_DB_NAME: "Purulia_Dhaba_DB"
    }), /exactly match/);
});

test("identity verification runs on the held DDL connection before any DDL", async () => {
    const db = new FakeDatabase();
    await runMigrations({ db, env: validEnv, migrations: smallMigrations(), logger: quietLogger() });

    const identityEvent = db.events.find((event) => /SELECT DATABASE\(\)/i.test(event.sql));
    const ddlEvents = db.events.filter((event) => event.ddl);
    assert.ok(identityEvent);
    assert.ok(ddlEvents.length >= 2);
    assert.ok(ddlEvents.every((event) => event.connectionId === identityEvent.connectionId));
    assert.ok(db.events.findIndex((event) => event === identityEvent) < db.events.findIndex((event) => event.ddl));
});

test("connection acquisition and identity failures stop before DDL", async () => {
    const acquisitionFailure = new FakeDatabase({ failAcquire: true });
    await assert.rejects(
        runMigrations({ db: acquisitionFailure, env: validEnv, migrations: smallMigrations(), logger: quietLogger() }),
        /Could not acquire/
    );

    const identityFailure = new FakeDatabase({ actualDatabase: "wrong_database" });
    await assert.rejects(
        runMigrations({ db: identityFailure, env: validEnv, migrations: smallMigrations(), logger: quietLogger() }),
        /did not match/
    );
    assert.equal(identityFailure.events.some((event) => event.ddl), false);

    const queryFailure = new FakeDatabase({ failIdentity: true });
    await assert.rejects(
        runMigrations({ db: queryFailure, env: validEnv, migrations: smallMigrations(), logger: quietLogger() }),
        /database operation failed/
    );
    assert.equal(queryFailure.events.some((event) => event.ddl), false);
});

test("applied migration checksum changes are refused", async () => {
    const db = new FakeDatabase();
    const migrations = smallMigrations();
    await runMigrations({ db, env: validEnv, migrations, logger: quietLogger() });
    const changed = smallMigrations("CREATE TABLE sample (id BIGINT NOT NULL);");
    await assert.rejects(
        runMigrations({ db, env: validEnv, migrations: changed, logger: quietLogger() }),
        /checksum or name changed/
    );
});

test("partial DDL failure is left unrecorded and rerun requires reconciliation", async () => {
    const db = new FakeDatabase({ failOnSql: "INSERT INTO deliberate_failure" });
    const migrations = smallMigrations("CREATE TABLE sample (id INT NOT NULL); INSERT INTO deliberate_failure VALUES (1);");
    await assert.rejects(
        runMigrations({ db, env: validEnv, migrations, logger: quietLogger() }),
        /partially applied/
    );
    assert.equal(db.history.some((row) => row.version === "0002"), false);

    await assert.rejects(
        runMigrations({ db, env: validEnv, migrations, logger: quietLogger() }),
        /pre-existing objects.*reconciliation/
    );
});

test("schema drift in a completed migration is detected", async () => {
    const db = new FakeDatabase();
    const migrations = smallMigrations();
    await runMigrations({ db, env: validEnv, migrations, logger: quietLogger() });
    db.tables.set("sample", "CREATE TABLE sample (id BIGINT NOT NULL)");

    await assert.rejects(
        runMigrations({ db, env: validEnv, migrations, logger: quietLogger() }),
        /schema drift detected/
    );
});

test("named lock prevents concurrent runners from both applying migrations", async () => {
    const db = new FakeDatabase({ delayFirstLock: true });
    const migrations = smallMigrations();
    const results = await Promise.allSettled([
        runMigrations({ db, env: validEnv, migrations, logger: quietLogger() }),
        runMigrations({ db, env: validEnv, migrations, logger: quietLogger() })
    ]);
    assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
    assert.equal(results.filter((result) => result.status === "rejected").length, 1);
});

test("ambiguous lock acquisition destroys the connection and never releases it", async () => {
    const db = new FakeDatabase({ failLockAfterGrant: true });
    await assert.rejects(runMigrations({ db, env: validEnv, migrations: smallMigrations(), logger: quietLogger() }));
    assert.equal(db.connections[0].destroyed, true);
    assert.equal(db.connections[0].releaseCount || 0, 0);
});

test("ambiguous lock release destroys the connection and reports cleanup failure", async () => {
    const db = new FakeDatabase({ failRelease: true });
    const messages = [];
    const logger = { log() {}, error: (...args) => messages.push(args) };
    await assert.rejects(
        runMigrations({ db, env: validEnv, migrations: smallMigrations(), logger }),
        (error) => /lock release failed/.test(error.message)
    );
    assert.equal(db.connections[0].destroyed, true);
    assert.equal(db.connections[0].releaseCount || 0, 0);
    assert.equal(messages.length, 1);
});

test("failed physical destruction is attached to the primary error and logged", async () => {
    const db = new FakeDatabase({ failLockAfterGrant: true, failDestroy: true });
    const messages = [];
    await assert.rejects(
        runMigrations({ db, env: validEnv, migrations: smallMigrations(), logger: { log() {}, error: (...args) => messages.push(args) } }),
        (error) => Boolean(error.cleanupError && error.cleanupError.cause)
    );
    assert.equal(db.connections[0].releaseCount || 0, 0);
    assert.equal(messages.length, 1);
});

test("SQL splitter respects quoted semicolons and comments", () => {
    assert.deepEqual(
        splitSqlStatements("SELECT 'a;b'; -- ignored;\nSELECT `c;d`; /* x;y */ SELECT 3;"),
        ["SELECT 'a;b'", "SELECT `c;d`", "SELECT 3"]
    );
});
