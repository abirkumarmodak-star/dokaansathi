const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");
const test = require("node:test");
const {
    assertDatabaseConfiguration,
    guardPool
} = require("../config/databaseIsolation");

function createFakePool({
    identityName = "purulia",
    identityError = null,
    acquisitionError = null
} = {}) {
    let identityCallback;
    let rawAcquisitions = 0;
    let applicationQueries = 0;
    let applicationExecutions = 0;
    let releasedConnections = 0;
    let transactionCalls = 0;

    const rawPool = new EventEmitter();
    rawPool._allConnections = [];
    rawPool._freeConnections = [];
    rawPool.getConnection = function getConnection(callback) {
        rawAcquisitions += 1;
        if (rawAcquisitions === 1 && acquisitionError) {
            queueMicrotask(() => callback(acquisitionError));
            return;
        }

        const verificationConnection = rawAcquisitions === 1;
        const connection = {
            query(sql, ...args) {
                const callback = args.at(-1);
                if (sql === "SELECT DATABASE() AS database_name") {
                    identityCallback = callback;
                    return;
                }

                applicationQueries += 1;
                queueMicrotask(() => callback(null, [{ ok: true }], [{ name: "ok" }]));
            },
            execute(sql, ...args) {
                const callback = args.at(-1);
                applicationExecutions += 1;
                queueMicrotask(() => callback(null, [{ ok: true }], [{ name: "ok" }]));
            },
            beginTransaction(callback) {
                transactionCalls += 1;
                queueMicrotask(() => callback(null));
            },
            commit(callback) {
                transactionCalls += 1;
                queueMicrotask(() => callback(null));
            },
            rollback(callback) {
                transactionCalls += 1;
                queueMicrotask(() => callback(null));
            },
            release() {
                releasedConnections += 1;
            },
            destroy() {},
            verificationConnection
        };

        rawPool._allConnections.push(connection);
        rawPool.emit("acquire", connection);
        queueMicrotask(() => callback(null, connection));
    };

    rawPool.query = function query(sql, ...args) {
        const callback = args.at(-1);
        const handle = { sql };
        this.getConnection((error, connection) => {
            if (error) {
                callback(error);
                return;
            }

            connection.query(sql, ...args.slice(0, -1), (queryError, rows, fields) => {
                connection.release();
                callback(queryError, rows, fields);
            });
        });
        return handle;
    };

    rawPool.execute = function execute(sql, ...args) {
        const callback = args.at(-1);
        this.getConnection((error, connection) => {
            if (error) {
                callback(error);
                return;
            }

            connection.execute(sql, ...args.slice(0, -1), (executeError, rows, fields) => {
                connection.release();
                callback(executeError, rows, fields);
            });
        });
        return { sql };
    };

    rawPool.end = (callback) => callback && callback(null);

    return {
        rawPool,
        get rawAcquisitions() { return rawAcquisitions; },
        get applicationQueries() { return applicationQueries; },
        get applicationExecutions() { return applicationExecutions; },
        get releasedConnections() { return releasedConnections; },
        get transactionCalls() { return transactionCalls; },
        get acquireListenerCount() { return rawPool.listenerCount("acquire"); },
        completeIdentity() {
            assert.equal(typeof identityCallback, "function");
            identityCallback(identityError, [{ database_name: identityName }]);
        }
    };
}

function callbackCall(target, method, ...args) {
    return new Promise(resolve => {
        target[method](...args, (error, result, fields) => resolve({ error, result, fields }));
    });
}

function waitForIdentityQuery() {
    return new Promise(resolve => setImmediate(resolve));
}

test("configuration requires a nonempty exact expected database name", () => {
    assert.throws(
        () => assertDatabaseConfiguration({ DB_NAME: "purulia" }),
        /PURULIA_EXPECTED_DB_NAME is required/
    );
    assert.throws(
        () => assertDatabaseConfiguration({ DB_NAME: "purulia", PURULIA_EXPECTED_DB_NAME: " " }),
        /PURULIA_EXPECTED_DB_NAME is required/
    );
    assert.throws(
        () => assertDatabaseConfiguration({ DB_NAME: "jana", PURULIA_EXPECTED_DB_NAME: "purulia" }),
        /DB_NAME must exactly match/
    );
    assert.equal(
        assertDatabaseConfiguration({ DB_NAME: "purulia", PURULIA_EXPECTED_DB_NAME: "purulia" }),
        "purulia"
    );
});

test("callback query, execute, and getConnection wait for identity verification", async () => {
    const fake = createFakePool();
    const db = guardPool(fake.rawPool, "purulia");
    const query = callbackCall(db, "query", "SELECT application data");
    const execute = callbackCall(db, "execute", "UPDATE application data", []);
    const connectionResult = callbackCall(db, "getConnection");

    await waitForIdentityQuery();
    assert.equal(fake.rawAcquisitions, 1);
    assert.equal(fake.applicationQueries, 0);
    fake.completeIdentity();

    const [queryResult, executeResult, { error: connectionError, result: connection }] = await Promise.all([
        query, execute, connectionResult
    ]);
    assert.equal(queryResult.error, null);
    assert.deepEqual(queryResult.result, [{ ok: true }]);
    assert.equal(executeResult.error, null);
    assert.equal(fake.applicationQueries, 1);
    assert.equal(fake.applicationExecutions, 1);
    assert.equal(connectionError, null);
    connection.release();
});

test("promise APIs return mysql2-style results and transaction-capable connections", async () => {
    const fake = createFakePool();
    const guardedDb = guardPool(fake.rawPool, "purulia");
    const promiseDb = guardedDb.promise();
    assert.equal(promiseDb.pool, undefined);
    assert.equal(promiseDb.on, undefined);
    const query = promiseDb.query("SELECT application data");

    await waitForIdentityQuery();
    fake.completeIdentity();
    const [rows, fields] = await query;
    assert.deepEqual(rows, [{ ok: true }]);
    assert.deepEqual(fields, [{ name: "ok" }]);

    const [executeRows] = await promiseDb.execute("UPDATE application data", []);
    assert.deepEqual(executeRows, [{ ok: true }]);
    const connection = await promiseDb.getConnection();
    assert.equal(connection.connection, undefined);
    await connection.beginTransaction();
    await connection.query("SELECT transactional data");
    await connection.commit();
    await connection.rollback();
    connection.release();

    assert.equal(fake.transactionCalls, 3);
    assert.equal(fake.applicationQueries, 2);
    assert.equal(fake.applicationExecutions, 1);
});

test("verification connection is released after success and identity failure", async () => {
    const successFake = createFakePool();
    const successDb = guardPool(successFake.rawPool, "purulia");
    const successfulQuery = callbackCall(successDb, "query", "SELECT application data");
    await waitForIdentityQuery();
    successFake.completeIdentity();
    await successfulQuery;
    assert.equal(successFake.releasedConnections, 2);

    const failureFake = createFakePool({ identityError: new Error("private connection detail") });
    const failureDb = guardPool(failureFake.rawPool, "purulia");
    const failedQuery = callbackCall(failureDb, "query", "SELECT application data");
    await waitForIdentityQuery();
    failureFake.completeIdentity();
    const failure = await failedQuery;
    assert.equal(failure.error.message, "Database identity verification failed.");
    assert.equal(failureFake.releasedConnections, 1);
});

test("verification acquisition failure is generic, cached, and fail-closed", async () => {
    const fake = createFakePool({ acquisitionError: new Error("credential-bearing raw error") });
    const db = guardPool(fake.rawPool, "purulia");
    const first = await callbackCall(db, "query", "DELETE application data");
    const second = await callbackCall(db, "getConnection");

    assert.equal(first.error.message, "Database identity verification failed.");
    assert.equal(second.error.message, "Database identity verification failed.");
    assert.equal(first.error.message.includes("credential-bearing"), false);
    assert.equal(fake.rawAcquisitions, 1);
    assert.equal(fake.applicationQueries, 0);
    assert.equal(fake.releasedConnections, 0);
});

test("concurrent calls share one verification attempt", async () => {
    const fake = createFakePool();
    const db = guardPool(fake.rawPool, "purulia");
    const query = callbackCall(db, "query", "SELECT application data");
    const connection = callbackCall(db, "getConnection");
    const execution = callbackCall(db, "execute", "UPDATE application data", []);

    await waitForIdentityQuery();
    assert.equal(fake.rawAcquisitions, 1);
    fake.completeIdentity();
    const [, { result: acquired }, executeResult] = await Promise.all([query, connection, execution]);
    acquired.release();
    assert.equal(executeResult.error, null);
    assert.equal(fake.rawAcquisitions, 4);
});

test("mismatched identity blocks all application operations and caches failure", async () => {
    const fake = createFakePool({ identityName: "other" });
    const db = guardPool(fake.rawPool, "purulia");
    const query = callbackCall(db, "query", "DELETE application data");
    const connection = callbackCall(db, "getConnection");

    await waitForIdentityQuery();
    fake.completeIdentity();
    const [queryFailure, connectionFailure] = await Promise.all([query, connection]);
    assert.equal(queryFailure.error.message, "Database identity verification failed.");
    assert.equal(connectionFailure.error.message, "Database identity verification failed.");
    assert.equal(fake.applicationQueries, 0);
    assert.equal(fake.rawAcquisitions, 1);
    assert.equal(fake.releasedConnections, 1);
});

test("facade does not expose pool internals or connection-bearing events", async () => {
    const fake = createFakePool();
    const db = guardPool(fake.rawPool, "purulia");

    assert.equal(db.pool, undefined);
    assert.equal(db._allConnections, undefined);
    assert.equal(db._freeConnections, undefined);
    assert.equal(db.on, undefined);
    assert.deepEqual(Object.keys(db).sort(), [
        "end", "execute", "getConnection", "promise", "query", "verifyDatabaseIdentity"
    ]);

    const query = callbackCall(db, "query", "SELECT application data");
    await waitForIdentityQuery();
    fake.completeIdentity();
    await query;
    assert.equal(fake.acquireListenerCount, 0);
});
