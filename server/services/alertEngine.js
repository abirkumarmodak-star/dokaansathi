const db = require("../config/db");

// =====================================
// CHECK PENDING ORDERS
// =====================================

exports.checkPendingOrders = () => {

    console.log("🔍 Checking Pending Orders...");

    const sql = `
        SELECT
            o.id,
            o.token_number
        FROM orders o
        WHERE o.order_status = 'Pending'
        AND NOT EXISTS (
            SELECT 1
            FROM alerts a
            WHERE a.order_id = o.id
            AND a.alert_type = 'PENDING_ORDER'
            AND a.is_read = 0
        )
    `;

    db.query(sql, (err, orders) => {

        if (err) {

            console.log(
                "❌ PENDING ORDER CHECK ERROR:",
                err
            );

            return;
        }

        console.log(
            `Pending Orders Requiring Alert : ${orders.length}`
        );

        if (orders.length === 0) {

            return;
        }

        const insertSql = `
            INSERT INTO alerts
            (
                order_id,
                user_type,
                alert_type,
                message
            )
            VALUES ?
        `;

        const values = orders.map((order) => [

            order.id,

            "owner",

            "PENDING_ORDER",

            `Token ${order.token_number} এখনও Accept করা হয়নি।`

        ]);

        db.query(
            insertSql,
            [values],
            (insertErr, result) => {

                if (insertErr) {

                    console.log(
                        "❌ ALERT INSERT ERROR:",
                        insertErr
                    );

                    return;
                }

                console.log(
                    `✅ ${result.affectedRows} Pending Order Alert(s) Created`
                );

            }
        );

    });

};