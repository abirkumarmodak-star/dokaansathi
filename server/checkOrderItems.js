require("dotenv").config();

const db = require("./config/db");

console.log("Checking order_items table...");

const sql = `
    SELECT
        order_id,
        COUNT(*) AS item_count
    FROM order_items
    GROUP BY order_id
    ORDER BY order_id DESC
`;

db.query(sql, (err, results) => {

    if (err) {

        console.log("❌ DATABASE ERROR:");
        console.log(err);

        process.exit(1);
    }

    console.log("========== ORDER ITEMS ==========");
    console.table(results);

    process.exit(0);
});