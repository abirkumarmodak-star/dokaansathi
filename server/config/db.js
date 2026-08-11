const mysql = require("mysql2");

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

    connection.release();

});


module.exports = db;