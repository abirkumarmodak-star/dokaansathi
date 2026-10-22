"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
    generateTrackingCapability,
    hashTrackingCapability,
    verifyTrackingCapability
} = require("../services/orderTrackingCapability");
const { createRateLimiter } = require("../middleware/rateLimit");

test("capabilities are cryptographically random and stored as one-way hashes", () => {
    const first = generateTrackingCapability();
    const second = generateTrackingCapability();
    assert.match(first, /^[A-Za-z0-9_-]{43}$/);
    assert.notEqual(first, second);
    const hash = hashTrackingCapability(first);
    assert.match(hash, /^[a-f0-9]{64}$/);
    assert.notEqual(hash, first);
    assert.equal(verifyTrackingCapability(hash, first), true);
    assert.equal(verifyTrackingCapability(hash, second), false);
});

test("missing, invalid and legacy-order capabilities fail closed", () => {
    assert.equal(verifyTrackingCapability(null, "capability"), false);
    assert.equal(verifyTrackingCapability("not-a-hash", "capability"), false);
    assert.equal(verifyTrackingCapability(hashTrackingCapability("valid"), ""), false);
    assert.equal(verifyTrackingCapability(null, undefined), false);
});

test("tracking and cancellation endpoints require the capability and return generic unavailable responses", () => {
    const source = fs.readFileSync(path.resolve(__dirname, "../controllers/orderController.js"), "utf8");
    const route = fs.readFileSync(path.resolve(__dirname, "../routes/orderRoutes.js"), "utf8");
    assert.match(source, /get\("X-Order-Tracking-Capability"\)/);
    assert.equal((source.match(/verifyTrackingCapability\(/g) || []).length, 2);
    assert.doesNotMatch(source.slice(source.indexOf("exports.cancelOrder"), source.indexOf("// ============================================================", source.indexOf("exports.cancelOrder") + 30)), /order_token|AND o\.token_number/);
    assert.match(source, /message: "Order unavailable"/);
    assert.match(route, /"\/token\/:token",\s*trackingRateLimit,\s*getOrderByToken/);
    assert.match(route, /"\/cancel", cancellationRateLimit, cancelOrder/);
    assert.match(source, /order_status IN \(\s*'Pending',\s*'Accepted'/);
    assert.match(source, /\["Preparing", "Ready", "Served", "Completed", "Cancelled"\]/);
});

test("rate limiter allows configured volume then rejects excess requests for one client IP", () => {
    let now = 1000;
    const limiter = createRateLimiter({
        name: "test",
        windowEnv: "UNSET_TEST_WINDOW",
        maxEnv: "UNSET_TEST_MAX",
        defaultWindowMs: 1000,
        defaultMax: 2,
        now: () => now
    });
    let nextCount = 0;
    const response = () => ({
        statusCode: 200,
        status(code) { this.statusCode = code; return this; },
        json(body) { this.body = body; return this; }
    });
    const req = { ip: "203.0.113.8" };
    const call = () => {
        const res = response();
        limiter(req, res, () => { nextCount += 1; });
        return res;
    };

    call();
    call();
    const limited = call();
    assert.equal(nextCount, 2);
    assert.equal(limited.statusCode, 429);
    assert.deepEqual(limited.body, { success: false, message: "Too many requests. Try again later." });
    now += 1000;
    call();
    assert.equal(nextCount, 3);
});

test("both user and staff login endpoints use rate limits", () => {
    const users = fs.readFileSync(path.resolve(__dirname, "../routes/userRoutes.js"), "utf8");
    const staff = fs.readFileSync(path.resolve(__dirname, "../routes/staffRoutes.js"), "utf8");
    assert.match(users, /router\.post\("\/login", loginRateLimit, userController\.loginUser\)/);
    assert.match(staff, /router\.post\("\/login", staffLoginRateLimit, staffLogin\)/);
});
