"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function route(name) {
    return fs.readFileSync(path.resolve(__dirname, "../routes", name), "utf8");
}

function controller(name) {
    return fs.readFileSync(path.resolve(__dirname, "../controllers", name), "utf8");
}

test("bootstrap is public only through the one-time endpoint; user listing is owner-only", () => {
    const source = route("userRoutes.js");
    assert.match(source, /router\.post\("\/bootstrap", userController\.createOwnerBootstrap\)/);
    assert.doesNotMatch(source, /router\.post\("\/",/);
    assert.match(source, /router\.get\("\/", authMiddleware, requireRole\("Owner"\)/);
});

test("shop settings and shop mutations require owner or manager authorization", () => {
    assert.match(route("shopSettingsRoutes.js"), /router\.get\([\s\S]*?authMiddleware,[\s\S]*?requireRole\("Owner"\)/);
    assert.match(route("shopSettingsRoutes.js"), /router\.put\([\s\S]*?authMiddleware,[\s\S]*?requireRole\("Owner"\)/);
    const shopRoutes = route("shopRoutes.js");
    assert.match(shopRoutes, /router\.post\("\/open", authMiddleware, requireRole\("Owner", "Manager"\)/);
    assert.match(shopRoutes, /router\.post\("\/close", authMiddleware, requireRole\("Owner", "Manager"\)/);
    assert.match(shopRoutes, /router\.get\("\/status", getShopStatus\)/);
});

test("customer menu, QR and order creation remain public; tracking and cancellation require a capability", () => {
    assert.match(route("menuRoutes.js"), /router\.get\([\s\S]*?"\/",[\s\S]*?getMenu/);
    assert.match(route("tableRoutes.js"), /"\/qr\/:qrCode",\s*getTableByQR/);
    assert.match(route("orderRoutes.js"), /router\.post\("\/", createOrder\)/);
    assert.match(route("orderRoutes.js"), /"\/token\/:token",\s*trackingRateLimit,\s*getOrderByToken/);
    assert.match(route("orderRoutes.js"), /router\.put\("\/cancel", cancellationRateLimit, cancelOrder\)/);
    assert.match(controller("orderController.js"), /get\("X-Order-Tracking-Capability"\)/);
    assert.match(controller("orderController.js"), /verifyTrackingCapability\(order\.tracking_token_hash, trackingCapability\)/);
    assert.doesNotMatch(controller("orderController.js"), /AND o\.token_number = \?/);
    assert.match(route("orderRoutes.js"), /router\.get\("\/", \.\.\.orderReaders, getOrders\)/);
    assert.match(route("orderRoutes.js"), /router\.put\(\s*"\/payment",\s*\.\.\.paymentManagers/);
});

test("operational inventory and menu writes are role-gated", () => {
    assert.match(route("inventoryRoutes.js"), /router\.put\("\/update-stock", \.\.\.inventoryManagers/);
    assert.match(route("menuRoutes.js"), /"\/toggle\/:id",[\s\S]*?\.\.\.ownerOrManager/);
    assert.match(route("staffRoutes.js"), /router\.post\("\/", authMiddleware, requireRole\("Owner"\), createStaff\)/);
});
