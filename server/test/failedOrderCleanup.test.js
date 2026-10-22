"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { cleanupFailedOrder } = require("../services/failedOrderCleanup");

function fakePool(options = {}) {
    const events = [];
    const state = { order: true, items: true, tracking: true };
    const connection = {
        beginTransaction(callback) { events.push("begin"); callback(options.failBegin || null); },
        query(sql, params, callback) {
            events.push(sql.replace(/\s+/g, " ").trim());
            if (sql.includes("order_items")) state.items = false;
            if (sql.includes("order_tracking_capabilities")) state.tracking = false;
            if (sql.includes("DELETE FROM orders")) {
                if (options.failParentDelete) return callback(new Error("parent FK failure"));
                state.order = false;
            }
            callback(null, { affectedRows: 1 });
        },
        commit(callback) { events.push("commit"); callback(options.failCommit || null); },
        rollback(callback) {
            events.push("rollback");
            state.order = true;
            state.items = true;
            state.tracking = true;
            callback(options.failRollback || null);
        },
        release() { events.push("release"); },
        destroy() { events.push("destroy"); }
    };
    return {
        events,
        state,
        connection,
        getConnection(callback) { callback(null, connection); }
    };
}

test("parent deletion failure rolls back child deletion atomically", async () => {
    const pool = fakePool({ failParentDelete: true });
    await assert.rejects(cleanupFailedOrder(pool, 42), /parent FK failure/);
    assert.deepEqual(pool.state, { order: true, items: true, tracking: true });
    assert.ok(pool.events.includes("rollback"));
    assert.ok(pool.events.includes("release"));
    assert.equal(pool.events.some((event) => /delivery_assignments|alerts|reviews/.test(event)), false);
});

test("rollback failure destroys the connection instead of returning it to the pool", async () => {
    const pool = fakePool({ failParentDelete: true, failRollback: new Error("rollback failed") });
    await assert.rejects(cleanupFailedOrder(pool, 42), (error) => Boolean(error.rollbackError));
    assert.ok(pool.events.includes("destroy"));
    assert.equal(pool.events.includes("release"), false);
});

test("successful cleanup commits both deletes", async () => {
    const pool = fakePool();
    await cleanupFailedOrder(pool, 42);
    assert.deepEqual(pool.state, { order: false, items: false, tracking: false });
    assert.ok(pool.events.includes("commit"));
    assert.ok(pool.events.includes("release"));
});
