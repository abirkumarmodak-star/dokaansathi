"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "database-free-authorization-test-secret";
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

function response() {
    return {
        statusCode: 200,
        body: null,
        status(code) { this.statusCode = code; return this; },
        json(value) { this.body = value; return this; }
    };
}

test("authentication rejects missing and invalid tokens without leaking details", () => {
    for (const authorization of [undefined, "Bearer invalid-token"]) {
        const res = response();
        let proceeded = false;
        authMiddleware({ headers: { authorization } }, res, () => { proceeded = true; });
        assert.equal(proceeded, false);
        assert.equal(res.statusCode, 401);
        assert.deepEqual(Object.keys(res.body).sort(), ["message", "success"]);
    }
});

test("role middleware rejects unauthenticated and incorrect roles, accepts allowed role", () => {
    const ownerOnly = requireRole("Owner");
    const unauthenticated = response();
    ownerOnly({}, unauthenticated, () => assert.fail("must reject missing identity"));
    assert.equal(unauthenticated.statusCode, 401);

    const manager = response();
    ownerOnly({ user: { id: 2, role: "Manager" } }, manager, () => assert.fail("manager is not owner"));
    assert.equal(manager.statusCode, 403);

    const owner = response();
    let proceeded = false;
    ownerOnly({ user: { id: 1, role: "Owner" } }, owner, () => { proceeded = true; });
    assert.equal(proceeded, true);
});

test("JWT authentication passes a valid identity to role checks", () => {
    const token = jwt.sign({ id: 9, role: "Kitchen" }, process.env.JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = response();
    let proceeded = false;
    authMiddleware(req, res, () => { proceeded = true; });
    assert.equal(proceeded, true);
    assert.deepEqual(req.user, { id: 9, role: "Kitchen", iat: req.user.iat });
});
