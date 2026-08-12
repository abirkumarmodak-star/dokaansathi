require("dotenv").config();

const db = require("./config/db");

console.log("Starting final test order cleanup...");

const startId = 8;
const endId = 45;

// ==============================
// STEP 1: DELETE ALERTS
// ==============================

const deleteAlertsSQL = `
    DELETE FROM alerts
    WHERE order_id BETWEEN ? AND ?
`;

db.query(
    deleteAlertsSQL,
    [startId, endId],
    (alertError, alertResult) => {

        if (alertError) {

            console.log("❌ Failed to delete alerts:");
            console.log(alertError);

            process.exit(1);
        }

        console.log(
            `✅ Deleted ${alertResult.affectedRows} alerts`
        );

        // ==============================
        // STEP 2: DELETE ORDERS
        // ==============================

        const deleteOrdersSQL = `
            DELETE FROM orders
            WHERE id BETWEEN ? AND ?
        `;

        db.query(
            deleteOrdersSQL,
            [startId, endId],
            (orderError, orderResult) => {

                if (orderError) {

                    console.log("❌ Failed to delete orders:");
                    console.log(orderError);

                    process.exit(1);
                }

                console.log(
                    `✅ Deleted ${orderResult.affectedRows} orders`
                );

                console.log(
                    "===================================="
                );

                console.log(
                    "✅ TEST ORDER CLEANUP COMPLETED"
                );

                console.log(
                    "===================================="
                );

                process.exit(0);
            }
        );
    }
);