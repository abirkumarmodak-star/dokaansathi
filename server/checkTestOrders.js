require("dotenv").config();

const db = require("./config/db");

const sql = `
    SELECT
        id,
        customer_id,
        order_type,
        payment_method,
        total_amount,
        order_status,
        payment_status,
        created_at
    FROM orders
    ORDER BY id DESC
`;

db.query(sql, (err, results) => {

    if (err) {
        console.log("❌ ERROR:");
        console.log(err);
        process.exit(1);
    }

    console.log("========== ALL ORDERS ==========");
    console.table(results);

    process.exit(0);
});