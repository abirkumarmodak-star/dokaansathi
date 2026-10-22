const path = require("path");
const dotenv = require("dotenv");

dotenv.config({
    path: path.resolve(__dirname, "../.env")
});
const mysql = require("mysql2");
const {
    assertDatabaseConfiguration,
    guardPool
} = require("./databaseIsolation");

const expectedDatabaseName = assertDatabaseConfiguration(process.env);


// ==============================
// MYSQL CONNECTION POOL
// ==============================

const db = guardPool(mysql.createPool({
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
}), expectedDatabaseName);


// ==============================
// EXPORT
// ==============================

module.exports = db;
