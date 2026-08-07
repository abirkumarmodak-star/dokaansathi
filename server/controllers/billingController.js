const db = require("../config/db");

// ==============================
// GET BILL BY ORDER ID
// ==============================

exports.getBill = (req, res) => {

    const { order_id } = req.params;

    // Get Bill Information
    const billSql = `
        SELECT
            o.id AS order_id,
            c.name AS customer_name,
            o.table_number,
            o.order_type,
            o.payment_status,
            o.order_status,
            o.total_amount,
            o.created_at
        FROM orders o
        JOIN customers c
            ON o.customer_id = c.id
        WHERE o.id = ?
    `;

    db.query(billSql, [order_id], (billErr, billResult) => {

        if (billErr) {

            console.log(billErr);

            return res.status(500).json({
                message: "Database Error"
            });

        }

        if (billResult.length === 0) {

            return res.status(404).json({
                message: "Bill Not Found"
            });

        }

        // Get Ordered Items
        const itemSql = `
            SELECT
                m.name,
                oi.quantity,
                oi.price,
                oi.subtotal
            FROM order_items oi
            JOIN menu m
                ON oi.menu_id = m.id
            WHERE oi.order_id = ?
        `;

        db.query(itemSql, [order_id], (itemErr, itemResult) => {

            if (itemErr) {

                console.log(itemErr);

                return res.status(500).json({
                    message: "Database Error"
                });

            }

            res.status(200).json({

                success: true,

                bill: billResult[0],

                items: itemResult

            });

        });

    });

};
// ==============================
// UPDATE PAYMENT STATUS
// ==============================

exports.payBill = (req, res) => {

    const { order_id } = req.body;

    const sql = `
        UPDATE orders
        SET payment_status = 'Paid'
        WHERE id = ?
    `;

    db.query(sql, [order_id], (err, result) => {

        if (err) {

            console.log(err);

            return res.status(500).json({
                message: "Database Error"
            });

        }

        if (result.affectedRows === 0) {

            return res.status(404).json({
                message: "Order Not Found"
            });

        }

        res.status(200).json({

            success: true,
            message: "Payment Completed Successfully"

        });

    });

};
// ==============================
// GET INVOICE
// ==============================

exports.getInvoice = (req, res) => {

    const { order_id } = req.params;

    const billSql = `
        SELECT
            o.id AS invoice_no,
            c.name AS customer_name,
            o.table_number,
            o.order_type,
            o.payment_status,
            o.total_amount,
            o.created_at
        FROM orders o
        JOIN customers c
            ON o.customer_id = c.id
        WHERE o.id = ?
    `;

    db.query(billSql, [order_id], (billErr, billResult) => {

        if (billErr) {

            console.log(billErr);

            return res.status(500).json({
                message: "Database Error"
            });

        }

        if (billResult.length === 0) {

            return res.status(404).json({
                message: "Invoice Not Found"
            });

        }

        const itemSql = `
            SELECT
                m.name,
                oi.quantity,
                oi.price,
                oi.subtotal
            FROM order_items oi
            JOIN menu m
                ON oi.menu_id = m.id
            WHERE oi.order_id = ?
        `;

        db.query(itemSql, [order_id], (itemErr, itemResult) => {

            if (itemErr) {

                console.log(itemErr);

                return res.status(500).json({
                    message: "Database Error"
                });

            }

            res.status(200).json({

                success: true,

                shop_name: "DOKAAN SATHI",

                invoice: billResult[0],

                items: itemResult,

                thank_you: "Thank You! Visit Again."

            });

        });

    });

};