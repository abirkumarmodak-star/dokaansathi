const db = require("../config/db");

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
exports.loginStaff = (phone, password, callback) => {

    const sql = `
        SELECT
            id,
            name,
            phone,
            role,
            status
        FROM staff
        WHERE phone = ?
        AND password = ?
        AND status = 'Active'
    `;

    db.query(sql, [phone, password], callback);

};