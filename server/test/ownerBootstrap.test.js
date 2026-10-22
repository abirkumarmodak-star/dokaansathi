"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { bootstrapFirstOwner } = require("../services/ownerBootstrap");

function fakePool({ existingOwner = false, failLockQuery = false } = {}) {
    const state = { lockHeld: false, owners: existingOwner ? [{ id: 1 }] : [], events: [], connections: [] };
    const pool = {
        state,
        getConnection(callback) {
            const connection = {
                query(sql, params, done) {
                    const values = Array.isArray(params) ? params : [];
                    state.events.push(sql.trim());
                    queueMicrotask(() => {
                        if (sql.includes("GET_LOCK")) {
                            if (failLockQuery) return done(new Error("ambiguous lock response"));
                            if (state.lockHeld) return done(null, [{ lock_acquired: 0 }]);
                            state.lockHeld = true;
                            return done(null, [{ lock_acquired: 1 }]);
                        }
                        if (sql.includes("RELEASE_LOCK")) {
                            state.lockHeld = false;
                            return done(null, [{ lock_released: 1 }]);
                        }
                        if (sql.startsWith("SELECT id FROM users")) return done(null, [...state.owners]);
                        if (sql.startsWith("INSERT INTO users")) {
                            state.owners.push({ id: 2, values });
                            return done(null, { insertId: 2 });
                        }
                        done(new Error("unexpected fake query"));
                    });
                },
                beginTransaction(callback) { state.events.push("begin"); queueMicrotask(() => callback(null)); },
                commit(callback) { state.events.push("commit"); queueMicrotask(() => callback(null)); },
                rollback(callback) { state.events.push("rollback"); queueMicrotask(() => callback(null)); },
                release() { state.events.push("release"); },
                destroy() { state.events.push("destroy"); }
            };
            state.connections.push(connection);
            callback(null, connection);
        }
    };
    return pool;
}

const ownerInput = { name: "Purulia Owner", phone: "9000000000", passwordHash: "test-hash", language: "English" };

test("bootstrap creates exactly one owner across concurrent requests", async () => {
    const pool = fakePool();
    const results = await Promise.allSettled([
        bootstrapFirstOwner(pool, ownerInput),
        bootstrapFirstOwner(pool, ownerInput)
    ]);

    assert.equal(pool.state.owners.length, 1);
    assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
    assert.equal(results.filter((result) => result.status === "rejected").length, 1);
    assert.equal(pool.state.owners[0].values[2], "test-hash");
    assert.ok(pool.state.events.includes("commit"));
});

test("bootstrap refuses when an owner already exists", async () => {
    const pool = fakePool({ existingOwner: true });
    assert.deepEqual(await bootstrapFirstOwner(pool, ownerInput), { created: false });
    assert.equal(pool.state.owners.length, 1);
    assert.equal(pool.state.events.includes("begin"), false);
});

test("ambiguous lock acquisition destroys the connection without releasing it", async () => {
    const pool = fakePool({ failLockQuery: true });
    await assert.rejects(bootstrapFirstOwner(pool, ownerInput), /ambiguous lock response/);
    assert.ok(pool.state.events.includes("destroy"));
    assert.equal(pool.state.events.includes("release"), false);
});
