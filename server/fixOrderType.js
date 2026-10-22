const path = require("path");

require("dotenv").config({
    path: path.join(__dirname, ".env")
});

const mysql = require("mysql2");
const {
    assertDatabaseConfiguration,
    verifyConnectedDatabase
} = require("./config/databaseIsolation");

let expectedDatabaseName;

try {
    expectedDatabaseName = assertDatabaseConfiguration(process.env);
} catch {
    console.error("Database configuration validation failed; script will stop.");
    process.exit(1);
}

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT)
});

db.connect((err) => {
    if (err) {
        console.error("Database connection failed; script will stop.");
        db.end(() => process.exitCode = 1);
        return;
    }

    verifyConnectedDatabase(db, expectedDatabaseName)
        .then(() => new Promise((resolve, reject) => {
            const sql = `
                ALTER TABLE orders
                MODIFY order_type
                ENUM('Manual','Dine-In','Delivery','Takeaway')
                NOT NULL
            `;

            db.query(sql, (queryError) => {
                if (queryError) {
                    reject(queryError);
                    return;
                }

                resolve();
            });
        }))
        .then(() => new Promise((resolve, reject) => {
            db.query(
                "SHOW COLUMNS FROM orders LIKE 'order_type'",
                (queryError, rows) => {
                    if (queryError) {
                        reject(queryError);
                        return;
                    }

                    resolve(rows);
                }
            );
        }))
        .then((rows) => {
            console.log("========== FINAL ORDER TYPE ==========");
            console.log(rows);
            console.log("======================================");
            db.end();
        })
        .catch(() => {
            console.error("Database identity verification or script query failed; script stopped.");
            db.end(() => process.exitCode = 1);
        });
});
