const db = require("../config/db");

// ===============================
// GET ALL STAFF
// ===============================

exports.getAllStaff = (callback) => {

    const sql = `
        SELECT
            id,
            name,
            phone,
            role,
            status,
            work_start_time,
    work_end_time
        FROM staff
        ORDER BY id DESC
    `;

    db.query(sql, callback);
};


// ===============================
// FIND STAFF BY PHONE
// Used while creating staff
// ===============================

exports.findByPhone = (phone, callback) => {

    const sql = `
        SELECT
            id,
            name,
            phone,
            role,
            status
        FROM staff
        WHERE phone = ?
    `;

    db.query(sql, [phone], callback);
};
db.query(
    `SELECT
        DATABASE() AS db,
        @@hostname AS host,
        @@port AS port,
        @@sql_mode AS sql_mode`,
    (err, result) => {

        if (err) {
            console.error("DB DEBUG ERROR =", err);
            return;
        }

        console.log("========== INSERT DB DEBUG ==========");
        console.log(result[0]);

        db.query(
            `SHOW COLUMNS FROM staff LIKE 'role'`,
            (err2, result2) => {

                if (err2) {
                    console.error("STAFF COLUMN DEBUG ERROR =", err2);
                    return;
                }

                console.log("========== STAFF ROLE DEBUG ==========");
                console.log(result2[0]);

                // YOUR EXISTING INSERT HERE
            }
        );
    }
);

// ===============================
// ADD NEW STAFF
// Password is already hashed
// in staffController.js
// ===============================

exports.addStaff = (staff, callback) => {

    const sql = `
        INSERT INTO staff
        (
            name,
            phone,
            password,
            role,
            work_start_time,
            work_end_time
        )
        VALUES
        (
            ?,
            ?,
            ?,
            ?,
            ?,
            ?
        )
    `;
console.log(
    "MODEL WORK HOURS =",
    staff.work_start_time,
    staff.work_end_time
);
    db.query(
        sql,
        [
            staff.name,
            staff.phone,
            staff.password,
            staff.role,
            staff.work_start_time,
            staff.work_end_time
        ],
        callback
    );
};

// ===============================
// GET STAFF BY PHONE
// Used during login
// ===============================

exports.getStaffByPhone = (phone, callback) => {

    const sql = `
        SELECT
            id,
            name,
            phone,
            password,
            role,
            status

        FROM staff
        WHERE phone = ?
        AND status = 'Active'
    `;

    db.query(sql, [phone], callback);
};
// ===============================
// UPDATE DELIVERY BOY ONLINE STATUS
// ===============================

exports.updateOnlineStatus = (
    staffId,
    onlineStatus,
    callback
) => {

    const sql = `
        UPDATE staff
        SET online_status = ?
        WHERE id = ?
        AND role = 'DeliveryBoy'
    `;

    db.query(
        sql,
        [
            onlineStatus,
            staffId
        ],
        callback
    );
};
// ===============================
// RESET STAFF PASSWORD
// Password must already be hashed
// ===============================

exports.updatePassword = (staffId, hashedPassword, callback) => {

    const sql = `
        UPDATE staff
        SET password = ?
        WHERE id = ?
    `;

    db.query(
        sql,
        [hashedPassword, staffId],
        callback
    );
};