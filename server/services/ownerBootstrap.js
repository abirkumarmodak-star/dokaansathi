"use strict";

const OWNER_BOOTSTRAP_LOCK = "purulia_dhaba_owner_bootstrap";

function query(connection, sql, values = []) {
    return new Promise((resolve, reject) => {
        connection.query(sql, values, (error, rows) => error ? reject(error) : resolve(rows));
    });
}

function getConnection(pool) {
    return new Promise((resolve, reject) => {
        pool.getConnection((error, connection) => error || !connection
            ? reject(error || new Error("Database connection unavailable."))
            : resolve(connection));
    });
}

function transactionMethod(connection, method) {
    return new Promise((resolve, reject) => {
        connection[method]((error) => error ? reject(error) : resolve());
    });
}

function destroy(connection) {
    if (typeof connection.destroy !== "function") {
        throw new Error("Owner bootstrap connection cannot be safely destroyed.");
    }
    connection.destroy();
}

async function bootstrapFirstOwner(pool, { name, phone, passwordHash, language }) {
    const connection = await getConnection(pool);
    let lockAttempted = false;
    let lockHeld = false;
    let transactionStarted = false;
    let commitOutcomeUncertain = false;
    let safeToRelease = false;
    let primaryError;
    let alreadyBootstrapped = false;

    try {
        lockAttempted = true;
        const lockRows = await query(connection, "SELECT GET_LOCK(?, 0) AS lock_acquired", [OWNER_BOOTSTRAP_LOCK]);
        const lockResult = lockRows && lockRows[0] && Number(lockRows[0].lock_acquired);
        if (lockResult === 0) {
            lockAttempted = false;
            safeToRelease = true;
            const error = new Error("Owner setup is already in progress. Please retry.");
            error.code = "OWNER_BOOTSTRAP_BUSY";
            throw error;
        }
        if (lockResult !== 1) {
            throw new Error("Owner bootstrap lock outcome is uncertain.");
        }
        lockHeld = true;

        const owners = await query(connection, "SELECT id FROM users WHERE LOWER(role) = 'owner' LIMIT 1");
        if (owners && owners.length) {
            alreadyBootstrapped = true;
        } else {
            transactionStarted = true;
            await transactionMethod(connection, "beginTransaction");
            await query(
                connection,
                "INSERT INTO users (name, phone, password, role, language) VALUES (?, ?, ?, 'Owner', ?)",
                [name, phone, passwordHash, language]
            );
            try {
                await transactionMethod(connection, "commit");
            } catch (error) {
                commitOutcomeUncertain = true;
                throw error;
            }
            transactionStarted = false;
        }
    } catch (error) {
        primaryError = error;
        if (transactionStarted) {
            try {
                await transactionMethod(connection, "rollback");
                transactionStarted = false;
            } catch (rollbackError) {
                error.rollbackError = rollbackError;
            }
        }
    } finally {
        if (lockHeld) {
            try {
                const releaseRows = await query(connection, "SELECT RELEASE_LOCK(?) AS lock_released", [OWNER_BOOTSTRAP_LOCK]);
                if (!releaseRows || !releaseRows[0] || Number(releaseRows[0].lock_released) !== 1) {
                    throw new Error("Owner bootstrap lock release could not be confirmed.");
                }
                lockHeld = false;
                lockAttempted = false;
                safeToRelease = !transactionStarted;
            } catch (releaseError) {
                if (primaryError) primaryError.lockReleaseError = releaseError;
                else primaryError = releaseError;
            }
        }

        if (lockAttempted || !safeToRelease || commitOutcomeUncertain) {
            try {
                destroy(connection);
            } catch (destroyError) {
                if (primaryError) primaryError.destroyError = destroyError;
                else primaryError = destroyError;
            }
        } else {
            try {
                connection.release();
            } catch (releaseError) {
                if (!primaryError) primaryError = releaseError;
                else primaryError.connectionReleaseError = releaseError;
                try {
                    destroy(connection);
                } catch (destroyError) {
                    primaryError.destroyError = destroyError;
                }
            }
        }
    }

    if (primaryError) throw primaryError;
    return { created: !alreadyBootstrapped };
}

module.exports = { bootstrapFirstOwner };
