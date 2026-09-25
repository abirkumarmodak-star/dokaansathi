const db = require("./server/config/db");

const sql = `
SELECT id, name, role, status, online_status, on_leave
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
