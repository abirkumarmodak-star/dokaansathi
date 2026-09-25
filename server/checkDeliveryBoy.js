const path = require("path");
require("dotenv").config({
    path: path.join(__dirname, ".env")
});

const db = require("./config/db");

const sql = `
SELECT
    id,
    name,
    role,
    status,
    online_status,
    on_leave,
    work_start_time,
    work_end_time
FROM staff
WHERE role = 'DeliveryBoy'
`;

db.query(sql, (err, results) => {
    if (err) {
        console.error("DB ERROR:", err);
    } else {
        console.table(results);
    }

    db.end();
});
