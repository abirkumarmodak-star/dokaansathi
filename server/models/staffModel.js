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

exports.getStaffById = (staffId, callback) => {
    const sql = `
        SELECT id, phone
        FROM staff
        WHERE id = ?
    `;

    db.query(sql, [staffId], callback);
};
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
// ===============================
// UPDATE DELIVERY BOY WORKING HOURS
// Owner changes existing DeliveryBoy hours
// ===============================

exports.updateWorkingHours = (
    staffId,
    workStartTime,
    workEndTime,
    callback
) => {

    const sql = `
        UPDATE staff
        SET
            work_start_time = ?,
            work_end_time = ?
        WHERE
            id = ?
            AND role = 'DeliveryBoy'
    `;

    db.query(
        sql,
        [
            workStartTime,
            workEndTime,
            staffId
        ],
        callback
    );
};
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
// ===============================
// UPDATE STAFF PHONE NUMBER
// ===============================

exports.updatePhone = (staffId, phone, callback) => {

    const sql = `
        UPDATE staff
        SET phone = ?
        WHERE id = ?
    `;

    db.query(sql, [phone, staffId], callback);
};
