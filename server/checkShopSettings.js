require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const db = require("./config/db");

db.query("DESCRIBE shop_settings", (err, rows) => {
    if (err) {
        console.error("ERROR:", err.message);
        process.exit(1);
    }

    console.table(rows);
    process.exit(0);
});
