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
            status
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
            role
        )
        VALUES
        (
            ?,
            ?,
            ?,
            ?
        )
    `;

    db.query(
        sql,
        [
            staff.name,
            staff.phone,
            staff.password,
            staff.role
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