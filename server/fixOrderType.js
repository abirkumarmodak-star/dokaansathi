const path = require("path");

require("dotenv").config({
    path: path.join(__dirname, ".env")
});

const mysql = require("mysql2");

console.log("========== FIX SCRIPT DB CONFIG ==========");
console.log("HOST:", process.env.DB_HOST);
console.log("USER:", process.env.DB_USER);
console.log("DATABASE:", process.env.DB_NAME);
console.log("PORT:", process.env.DB_PORT);
console.log("PASSWORD EXISTS:", !!process.env.DB_PASSWORD);
console.log("==========================================");

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT)
});

db.connect((err) => {

    if (err) {
        console.log("❌ DATABASE CONNECTION FAILED:");
        console.log(err);
        return;
    }

    console.log("✅ AIVEN DATABASE CONNECTED");

    const sql = `
        ALTER TABLE orders
        MODIFY order_type
        ENUM('Manual','Dine-In','Delivery','Takeaway')
        NOT NULL
    `;

    db.query(sql, (err, result) => {

        if (err) {
            console.log("❌ ALTER FAILED:");
            console.log(err);
            return;
        }

        console.log("✅ ORDER TYPE ALTER SUCCESSFUL");

        db.query(
            "SHOW COLUMNS FROM orders LIKE 'order_type'",
            (err, rows) => {

                if (err) {
                    console.log(err);
                    return;
                }

                console.log("========== FINAL ORDER TYPE ==========");
                console.log(rows);
                console.log("======================================");

                db.end();
            }
        );
    });
});