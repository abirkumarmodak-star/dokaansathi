require("dotenv").config();

const db = require("./config/db");

console.log("Checking alerts for test orders...");

const sql = `
    SELECT
        id,
        order_id
    FROM alerts
    WHERE order_id BETWEEN 8 AND 45
    ORDER BY order_id DESC
`;

db.query(sql, (err, results) => {

    if (err) {

        console.log("❌ DATABASE ERROR:");
        console.log(err);

        process.exit(1);
    }

    console.log("========== TEST ORDER ALERTS ==========");
    console.table(results);

    process.exit(0);
});