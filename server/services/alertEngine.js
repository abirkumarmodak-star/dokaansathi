
const db = require("../config/db");

// =====================================
// CHECK PENDING ORDERS
// =====================================

exports.checkPendingOrders = () => {

    console.log("🔍 Checking Pending Orders...");

    const sql = `
        SELECT *
        FROM orders
        WHERE order_status = 'Pending'
    `;

    db.query(sql, (err, orders) => {

        if (err) {
            console.log(err);
            return;
        }

        console.log(`Pending Orders Found : ${orders.length}`);

        orders.forEach((order) => {

            // একই alert আগেই আছে কিনা check করো
            const checkSql = `
                SELECT *
                FROM alerts
                WHERE order_id = ?
                AND alert_type = 'PENDING_ORDER'
                AND is_read = 0
            `;

            db.query(checkSql, [order.id], (err, existing) => {

                if (err) {
                    console.log(err);
                    return;
                }

                // যদি alert আগে থেকেই থাকে তাহলে নতুন alert বানাবে না
                if (existing.length > 0) {
                    return;
                }

                // নতুন Alert Insert
                const insertSql = `
                    INSERT INTO alerts
                    (
                        order_id,
                        user_type,
                        alert_type,
                        message
                    )
                    VALUES (?, ?, ?, ?)
                `;

                db.query(

                    insertSql,

                    [
                        order.id,
                        "owner",
                        "PENDING_ORDER",
                        `Token ${order.token_number} এখনও Accept করা হয়নি।`
                    ],

                    (err) => {

                        if (err) {
                            console.log(err);
                            return;
                        }

                        console.log(
                            `✅ Alert Created for Token ${order.token_number}`
                        );

                    }

                );

            });

        });

    });

};