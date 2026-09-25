const path = require("path");
const dotenv = require("dotenv");

dotenv.config({
    path: path.resolve(__dirname, "../.env")
});
const mysql = require("mysql2");
const crypto = require("crypto");

// ==============================
// SAFE DATABASE CONFIG DEBUG
// ==============================

const password = process.env.DB_PASSWORD || "";

console.log("========== DB ENV DEBUG ==========");
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_NAME:", process.env.DB_NAME);
console.log("DB_PORT:", process.env.DB_PORT);
console.log("PASSWORD_PRESENT:", password.length > 0);
console.log("PASSWORD_LENGTH:", password.length);

console.log(
    "PASSWORD_HASH:",
    crypto
        .createHash("sha256")
        .update(password)
        .digest("hex")
);

console.log("===================================");


// ==============================
// MYSQL CONNECTION POOL
// ==============================

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,

    ssl: {
        rejectUnauthorized: false
    },

    waitForConnections: true,

    connectionLimit: 10,

    queueLimit: 0,

    connectTimeout: 20000,

    enableKeepAlive: true,

    keepAliveInitialDelay: 10000
});


// ==============================
// TEST DATABASE CONNECTION
// ==============================

db.getConnection((err, connection) => {

    if (err) {

        console.log("❌ MySQL Connection Failed");
        console.log(err);

        return;
    }

    console.log("✅ MySQL Connected Successfully");

    connection.query(
        `
        SELECT
            DATABASE() AS database_name,
            @@hostname AS db_host,
            @@port AS db_port
        `,
        (queryErr, result) => {

            if (queryErr) {

                console.log(
                    "❌ DB DEBUG QUERY FAILED:",
                    queryErr
                );

            } else {

                console.log(
                    "========== DATABASE DEBUG =========="
                );

                console.log(
                    "DATABASE:",
                    result[0].database_name
                );

                console.log(
                    "HOST:",
                    result[0].db_host
                );

                console.log(
                    "PORT:",
                    result[0].db_port
                );

                console.log(
                    "===================================="
                );
            }

            connection.release();
        }
    );

});


// ==============================
// EXPORT
// ==============================

module.exports = db;