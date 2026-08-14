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


module.exports = db;