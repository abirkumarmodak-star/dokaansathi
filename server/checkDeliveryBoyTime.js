const path = require("path");
require("dotenv").config({
    path: path.join(__dirname, ".env")
});

const db = require("./config/db");

const sql = `
SELECT
    s.id,
    s.name,
    s.work_start_time,
    s.work_end_time,
    ADDTIME(CURTIME(), '05:30:00') AS current_india_time,
    (
        ADDTIME(CURTIME(), '05:30:00')
        BETWEEN s.work_start_time AND s.work_end_time
    ) AS within_work_time
FROM staff s
WHERE s.id = 8
`;

db.query(sql, (err, results) => {
    if (err) {
        console.error("DB ERROR:", err);
    } else {
        console.table(results);
    }

    db.end();
});
