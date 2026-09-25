require("dotenv").config();

const mysql = require("mysql2");

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT),
    ssl: {
        rejectUnauthorized: false
    }
});

db.connect((err) => {

    if (err) {
        console.log("❌ CONNECTION ERROR");
        console.log(err.message);
        return;
    }

    console.log("✅ AIVEN CONNECTED");

    db.query(
        "SHOW TABLES LIKE 'delivery_assignments'",
        (err, result) => {

            if (err) {
                console.log("❌ QUERY ERROR");
                console.log(err.message);
            } else {

                console.log(
                    "========== AIVEN DELIVERY TABLE =========="
                );

                console.log(result);

                console.log(
                    "=========================================="
                );
            }

            db.end();
        }
    );
});