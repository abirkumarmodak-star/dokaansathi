const db = require("../config/db");


// ======================================================
// CREATE DELIVERY ASSIGNMENT
// ======================================================

exports.createAssignment = (orderId, deliveryBoyId, callback) => {

    const sql = `
        INSERT INTO delivery_assignments
        (
            order_id,
            delivery_boy_id,
            status
        )
        VALUES (?, ?, 'Assigned')
    `;

    db.query(
        sql,
        [
            orderId,
            deliveryBoyId
        ],
        callback
    );

};


// ======================================================
// GET ALL DELIVERY ASSIGNMENTS
// ======================================================

exports.getAllAssignments = (callback) => {

    const sql = `
        SELECT
            da.id,
            da.order_id,
            da.delivery_boy_id,
            da.status,
            da.assigned_at,
            da.accepted_at,
            da.out_for_delivery_at,
            da.delivered_at,

            staff.name AS delivery_boy_name,
            staff.phone AS delivery_boy_phone

        FROM delivery_assignments da

        JOIN staff
        ON da.delivery_boy_id = staff.id

        ORDER BY da.id DESC
    `;

    db.query(sql, callback);

};


// ======================================================
// GET ASSIGNMENTS OF ONE DELIVERY BOY
// ======================================================

exports.getAssignmentsByDeliveryBoy = (
    deliveryBoyId,
    callback
) => {

    const sql = `
        SELECT
            da.id,
            da.order_id,
            da.delivery_boy_id,
            da.status,
            da.assigned_at,
            da.accepted_at,
            da.out_for_delivery_at,
            da.delivered_at,

            staff.name AS delivery_boy_name,
            staff.phone AS delivery_boy_phone

        FROM delivery_assignments da

        JOIN staff
        ON da.delivery_boy_id = staff.id

        WHERE da.delivery_boy_id = ?

        ORDER BY da.id DESC
    `;

    db.query(
        sql,
        [deliveryBoyId],
        callback
    );

};


// ======================================================
// GET ASSIGNMENT BY ORDER
// ======================================================

exports.getAssignmentByOrder = (
    orderId,
    callback
) => {

    const sql = `
        SELECT
            da.id,
            da.order_id,
            da.delivery_boy_id,
            da.status,
            da.assigned_at,
            da.accepted_at,
            da.out_for_delivery_at,
            da.delivered_at,

            staff.name AS delivery_boy_name,
            staff.phone AS delivery_boy_phone

        FROM delivery_assignments da

        JOIN staff
        ON da.delivery_boy_id = staff.id

        WHERE da.order_id = ?
    `;

    db.query(
        sql,
        [orderId],
        callback
    );

};


// ======================================================
// UPDATE DELIVERY STATUS
// ======================================================

exports.updateStatus = (
    assignmentId,
    status,
    callback
) => {

    const sql = `
        UPDATE delivery_assignments
        SET status = ?
        WHERE id = ?
    `;

    db.query(
        sql,
        [
            status,
            assignmentId
        ],
        callback
    );

};