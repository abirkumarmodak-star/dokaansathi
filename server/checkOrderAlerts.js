require("dotenv").config();

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
    port: Number(process.env.DB_PORT),
    ssl: {
        rejectUnauthorized: false
    }
});

db.connect((err) => {
    if (err) {
        console.error("Database connection failed; script will stop.");
        db.end(() => process.exitCode = 1);
        return;
    }

    verifyConnectedDatabase(db, expectedDatabaseName)
        .then(() => new Promise((resolve, reject) => {
            db.query(
                "SHOW TABLES LIKE 'delivery_assignments'",
                (queryError, result) => {
                    if (queryError) {
                        reject(queryError);
                        return;
                    }

                    resolve(result);
                }
            );
        }))
        .then((result) => {
            console.log("========== DELIVERY ASSIGNMENT TABLE ==========");
            console.log(result);
            console.log("===============================================");
            db.end();
        })
        .catch(() => {
            console.error("Database identity verification or query failed; script will stop.");
            db.end(() => process.exitCode = 1);
        });
});
