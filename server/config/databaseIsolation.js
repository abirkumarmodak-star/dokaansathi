function assertDatabaseConfiguration(env = process.env) {
    const expectedDatabaseName = env.PURULIA_EXPECTED_DB_NAME;

    if (
        typeof expectedDatabaseName !== "string" ||
        expectedDatabaseName.trim().length === 0
    ) {
        throw new Error("PURULIA_EXPECTED_DB_NAME is required.");
    }

    if (
        typeof env.DB_NAME !== "string" ||
        env.DB_NAME.length === 0 ||
        env.DB_NAME !== expectedDatabaseName
    ) {
        throw new Error("DB_NAME must exactly match PURULIA_EXPECTED_DB_NAME.");
    }

    return expectedDatabaseName;
}

function verifyConnectedDatabase(connection, expectedDatabaseName) {
    return new Promise((resolve, reject) => {
        connection.query(
            "SELECT DATABASE() AS database_name",
            (error, rows) => {
                if (error) {
                    reject(new Error("Database identity verification failed."));
                    return;
                }

                const actualDatabaseName = rows && rows[0] && rows[0].database_name;

                if (actualDatabaseName !== expectedDatabaseName) {
                    reject(new Error("Connected database identity did not match."));
                    return;
                }

                resolve();
            }
        );
    });
}

function callbackPromise(target, method, args) {
    return new Promise((resolve, reject) => {
        target[method](...args, (error, rows, fields) => {
            if (error) {
                reject(error);
                return;
            }

            resolve([rows, fields]);
        });
    });
}

function callbackVoid(target, method) {
    return new Promise((resolve, reject) => {
        target[method]((error) => error ? reject(error) : resolve());
    });
}

function promiseConnection(connection) {
    return Object.freeze({
        query: (...args) => callbackPromise(connection, "query", args),
        execute: (...args) => callbackPromise(connection, "execute", args),
        beginTransaction: () => callbackVoid(connection, "beginTransaction"),
        commit: () => callbackVoid(connection, "commit"),
        rollback: () => callbackVoid(connection, "rollback"),
        release: () => connection.release(),
        destroy: () => connection.destroy()
    });
}

function guardPool(rawPool, expectedDatabaseName) {
    const acquireRawConnection = rawPool.getConnection.bind(rawPool);
    const rawQuery = rawPool.query.bind(rawPool);
    const rawExecute = rawPool.execute.bind(rawPool);
    const rawEnd = rawPool.end.bind(rawPool);
    let verificationPromise;

    const getRawConnection = () => new Promise((resolve, reject) => {
        try {
            acquireRawConnection((error, connection) => {
                if (error || !connection) {
                    reject(new Error("Database connection failed."));
                    return;
                }

                resolve(connection);
            });
        } catch {
            reject(new Error("Database connection failed."));
        }
    });

    const verifyDatabaseIdentity = () => {
        if (!verificationPromise) {
            verificationPromise = getRawConnection()
                .then(async (connection) => {
                    try {
                        await verifyConnectedDatabase(connection, expectedDatabaseName);
                    } finally {
                        connection.release();
                    }
                })
                .catch(() => {
                    throw new Error("Database identity verification failed.");
                });
        }

        return verificationPromise;
    };

    const acquireVerifiedConnection = () => verifyDatabaseIdentity()
        .then(getRawConnection, () => {
            throw new Error("Database identity verification failed.");
        });

    // mysql2 Pool.query/execute obtain connections through this method. Keep this
    // override private: the returned facade below exposes only supported methods.
    rawPool.getConnection = function getVerifiedConnection(callback) {
        if (typeof callback !== "function") {
            return acquireVerifiedConnection();
        }

        acquireVerifiedConnection().then(
            (connection) => callback(null, connection),
            () => callback(new Error("Database identity verification failed."))
        );
    };

    let facade;
    const promiseFacade = Object.freeze({
        query: (...args) => callbackPromise(facade, "query", args),
        execute: (...args) => callbackPromise(facade, "execute", args),
        getConnection: () => acquireVerifiedConnection().then(promiseConnection),
        end: () => new Promise((resolve, reject) => {
            facade.end((error) => error ? reject(error) : resolve());
        })
    });

    facade = Object.freeze({
        query: (...args) => rawQuery(...args),
        execute: (...args) => rawExecute(...args),
        getConnection(callback) {
            if (typeof callback !== "function") {
                return acquireVerifiedConnection();
            }

            acquireVerifiedConnection().then(
                (connection) => callback(null, connection),
                () => callback(new Error("Database identity verification failed."))
            );
        },
        verifyDatabaseIdentity,
        end(...args) {
            return rawEnd(...args);
        },
        promise: () => promiseFacade
    });

    return facade;
}

module.exports = {
    assertDatabaseConfiguration,
    verifyConnectedDatabase,
    guardPool
};
