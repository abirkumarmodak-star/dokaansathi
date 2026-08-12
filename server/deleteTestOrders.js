require("dotenv").config();

const db = require("./config/db");

console.log("Starting test order cleanup...");

const startId = 8;
const endId = 45;

// Step 1: Delete order items
const deleteItemsSQL = `
    DELETE FROM order_items
    WHERE order_id BETWEEN ? AND ?
`;

db.query(
    deleteItemsSQL,
    [startId, endId],
    (itemsError, itemsResult) => {

        if (itemsError) {

            console.log("❌ Failed to delete order items:");
            console.log(itemsError);

            process.exit(1);
        }

        console.log(
            `✅ Deleted ${itemsResult.affectedRows} order_items`
        );

        // Step 2: Delete orders
        const deleteOrdersSQL = `
            DELETE FROM orders
            WHERE id BETWEEN ? AND ?
        `;

        db.query(
            deleteOrdersSQL,
            [startId, endId],
            (ordersError, ordersResult) => {

                if (ordersError) {

                    console.log("❌ Failed to delete orders:");
                    console.log(ordersError);

                    process.exit(1);
                }

                console.log(
                    `✅ Deleted ${ordersResult.affectedRows} orders`
                );

                console.log(
                    "================================"
                );

                console.log(
                    "✅ TEST ORDERS DELETED SUCCESSFULLY"
                );

                console.log(
                    "================================"
                );

                process.exit(0);
            }
        );
    }
);