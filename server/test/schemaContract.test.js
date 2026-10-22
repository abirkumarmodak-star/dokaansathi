"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { loadMigrations } = require("../scripts/migrate");

const migrations = loadMigrations(path.resolve(__dirname, "../migrations"));
const sqlByVersion = new Map(migrations.map((migration) => [migration.version, migration.sql]));
const allSql = [...sqlByVersion.values()].join("\n");

test("migration files are contiguous and table dependencies are ordered", () => {
    assert.deepEqual(migrations.map((migration) => migration.version), ["0001", "0002", "0003", "0004", "0005", "0006", "0007"]);
    assert.match(sqlByVersion.get("0003"), /CREATE TABLE menu/);
    assert.match(sqlByVersion.get("0003"), /FOREIGN KEY \(menu_id\) REFERENCES menu/);
    assert.match(sqlByVersion.get("0004"), /FOREIGN KEY \(customer_id\) REFERENCES customers/);
    assert.match(sqlByVersion.get("0004"), /FOREIGN KEY \(shop_id\) REFERENCES shop_settings/);
    assert.match(sqlByVersion.get("0004"), /FOREIGN KEY \(order_id\) REFERENCES orders/);
    assert.match(sqlByVersion.get("0005"), /FOREIGN KEY \(order_id\) REFERENCES orders/);
    assert.match(sqlByVersion.get("0006"), /FOREIGN KEY \(order_id\) REFERENCES orders/);
    assert.match(sqlByVersion.get("0007"), /CREATE TABLE order_tracking_capabilities/);
    assert.match(sqlByVersion.get("0007"), /FOREIGN KEY \(order_id\) REFERENCES orders/);
});

test("all 18 required tables and critical application columns are represented", () => {
    const requiredTables = [
        "alerts", "combos", "customers", "delivery_assignment_attempts", "delivery_assignments",
        "inventory", "menu", "order_items", "orders", "push_subscriptions", "restaurant_tables",
        "order_tracking_capabilities", "reviews", "shop_settings", "shop_status", "staff", "users", "whatsapp_settings"
    ];
    for (const table of requiredTables) {
        assert.match(allSql, new RegExp(`CREATE TABLE ${table}\\s*\\(`), `${table} migration missing`);
    }

    for (const column of [
        "delivery_address", "pending_cancellation_amount", "half_price", "full_price", "shop_id",
        "cashback_paid_by", "work_start_time", "work_end_time", "online_status", "on_leave",
        "current_order_id", "attempt_no", "p256dh", "emergency_mode"
    ]) {
        assert.match(allSql, new RegExp(`\\b${column}\\b`), `${column} column missing`);
    }
});

test("required enum values and safe schema policies are preserved", () => {
    assert.match(allSql, /price DECIMAL\(10,2\) NULL/);
    assert.match(sqlByVersion.get("0004"), /shop_id INT UNSIGNED NOT NULL,\s+table_number/);
    assert.doesNotMatch(sqlByVersion.get("0004").match(/shop_id INT UNSIGNED NOT NULL[^,]*/)?.[0] || "", /DEFAULT/);
    assert.match(sqlByVersion.get("0004"), /'Manual', 'Dine-In', 'Delivery', 'Takeaway'/);
    assert.match(sqlByVersion.get("0004"), /'Pending', 'Accepted', 'Preparing', 'Ready', 'Served', 'Completed', 'Cancelled'/);
    assert.match(sqlByVersion.get("0002"), /'DeliveryBoy'/);
    assert.match(sqlByVersion.get("0005"), /'Assigned', 'Accepted', 'OutForDelivery', 'Delivered', 'Cancelled'/);
    assert.match(sqlByVersion.get("0005"), /'Assigned', 'Reminded', 'Expired'/);
    assert.match(sqlByVersion.get("0002"), /INSERT INTO shop_status \(id, status\) VALUES \(1, 'CLOSED'\)/);
    assert.match(sqlByVersion.get("0002"), /INSERT INTO whatsapp_settings \(id, emergency_mode\) VALUES \(1, 0\)/);
    assert.doesNotMatch(sqlByVersion.get("0002"), /INSERT INTO shop_settings|INSERT INTO users|INSERT INTO staff/);
    assert.doesNotMatch(allSql, /ON DELETE CASCADE/i);
});

test("runner stays standalone and does not import application startup", () => {
    const runnerSource = fs.readFileSync(path.resolve(__dirname, "../scripts/migrate.js"), "utf8");
    assert.doesNotMatch(runnerSource, /require\([^)]*server\.js/);
    assert.match(runnerSource, /require\("\.\.\/config\/db"\)/);
    assert.match(runnerSource, /SELECT DATABASE\(\) AS database_name/);
    assert.match(runnerSource, /GET_LOCK/);
    assert.match(runnerSource, /schema_fingerprint/);
    assert.match(runnerSource, /checksum or name changed/);
});
