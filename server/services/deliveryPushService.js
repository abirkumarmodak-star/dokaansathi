const webPush = require("../config/webPush");
const db = require("../config/db");


// ==================================================
// SEND PUSH TO ONE DELIVERY BOY
// ==================================================

const sendPushToDeliveryBoy = async (
    deliveryBoyId,
    notificationData
) => {

    if (!deliveryBoyId) {

        throw new Error(
            "Delivery Boy ID is required"
        );

    }


    // ==================================================
    // FIND PUSH SUBSCRIPTIONS
    // ==================================================

    const rows = await new Promise(
        (resolve, reject) => {

            const sql = `
                SELECT
                    id,
                    endpoint,
                    p256dh,
                    auth
                FROM push_subscriptions
                WHERE staff_id = ?
            `;

            db.query(
                sql,
                [deliveryBoyId],
                (err, result) => {

                    if (err) {

                        return reject(err);

                    }

                    resolve(result);

                }
            );

        }
    );


    // ==================================================
    // NO SUBSCRIPTION
    // ==================================================

    if (!rows.length) {

        console.log(
            "⚠️ NO PUSH SUBSCRIPTION FOR DELIVERY BOY:",
            deliveryBoyId
        );

        return {

            success: false,

            subscriptionsFound: 0,

            notificationsSent: 0

        };

    }


    // ==================================================
    // CREATE PUSH PAYLOAD
    // ==================================================

    const payload =
        JSON.stringify({

            title:
                notificationData.title ||
                "🚚 New Delivery Order",

            body:
                notificationData.body ||
                "A delivery order has been assigned to you.",

            icon:
                "/favicon.svg",

            badge:
                "/favicon.svg",

            tag:
                notificationData.tag ||
                `delivery-order-${notificationData.orderId}-attempt-${notificationData.attemptNo}`,

            url:
                notificationData.url ||
                "/staff-dashboard",

            orderId:
                notificationData.orderId ||
                null,

            assignmentId:
                notificationData.assignmentId ||
                null,

            attemptNo:
                notificationData.attemptNo ||
                null

        });


    let notificationsSent = 0;


    // ==================================================
    // SEND TO ALL SUBSCRIPTIONS OF THIS DELIVERY BOY
    // ==================================================

    for (
        const row of rows
    ) {

        const subscription = {

            endpoint:
                row.endpoint,

            keys: {

                p256dh:
                    row.p256dh,

                auth:
                    row.auth

            }

        };


        try {

            await webPush.sendNotification(

                subscription,

                payload,

                {

                    TTL: 60,

                    urgency: "high"

                }

            );


            notificationsSent++;


            console.log(
                "✅ DELIVERY PUSH SENT",
                {
                    deliveryBoyId,
                    subscriptionId: row.id,
                    orderId:
                        notificationData.orderId,
                    attemptNo:
                        notificationData.attemptNo
                }
            );

        }


        catch (error) {

            console.error(
                "❌ DELIVERY PUSH ERROR:",
                {
                    deliveryBoyId,
                    subscriptionId: row.id,
                    error:
                        error.message
                }
            );


            // ==================================================
            // REMOVE DEAD SUBSCRIPTION
            // 404 / 410 usually means subscription no longer valid
            // ==================================================

            if (
                error.statusCode === 404 ||
                error.statusCode === 410
            ) {

                db.query(
                    `
                        DELETE FROM push_subscriptions
                        WHERE id = ?
                    `,
                    [row.id],
                    deleteErr => {

                        if (deleteErr) {

                            console.error(
                                "❌ FAILED TO DELETE DEAD PUSH SUBSCRIPTION:",
                                deleteErr
                            );

                        }

                        else {

                            console.log(
                                "🧹 DEAD PUSH SUBSCRIPTION REMOVED:",
                                row.id
                            );

                        }

                    }
                );

            }

        }

    }


    return {

        success:
            notificationsSent > 0,

        subscriptionsFound:
            rows.length,

        notificationsSent

    };

};
// ==================================================
// 🔔 SEND PUSH TO ALL MANAGERS
// ONLY USED FOR NEW DELIVERY ORDERS
// ==================================================

const sendPushToManagers = async (
    notificationData
) => {

    // ==============================================
    // FIND MANAGER PUSH SUBSCRIPTIONS
    // ==============================================

    const rows = await new Promise(
        (resolve, reject) => {

            const sql = `
                SELECT
                    ps.id,
                    ps.endpoint,
                    ps.p256dh,
                    ps.auth

                FROM push_subscriptions ps

                INNER JOIN staff s
                    ON s.id = ps.staff_id

                WHERE s.role = 'Manager'
            `;

            db.query(
                sql,
                [],
                (err, result) => {

                    if (err) {

                        return reject(err);

                    }

                    resolve(result);

                }
            );

        }
    );


    // ==============================================
    // NO MANAGER SUBSCRIPTION
    // ==============================================

    if (!rows.length) {

        console.log(
            "⚠️ NO PUSH SUBSCRIPTION FOR MANAGER"
        );

        return {

            success: false,

            subscriptionsFound: 0,

            notificationsSent: 0

        };

    }


    // ==============================================
    // CREATE MANAGER PUSH PAYLOAD
    // ==============================================

    const payload =
        JSON.stringify({

            type:
                "MANAGER_DELIVERY_ALERT",

            title:
                notificationData.title ||
                "🚚 New Delivery Order",

            body:
                notificationData.body ||
                "A new delivery order has been received.",

            icon:
                "/favicon.svg",

            badge:
                "/favicon.svg",

            tag:
                notificationData.tag ||
                `manager-delivery-order-${notificationData.orderId}`,

            url:
                notificationData.url ||
                "/staff-dashboard",

            orderId:
                notificationData.orderId ||
                null

        });


    let notificationsSent = 0;


    // ==============================================
    // SEND TO ALL MANAGER SUBSCRIPTIONS
    // ==============================================

    for (
        const row of rows
    ) {

        const subscription = {

            endpoint:
                row.endpoint,

            keys: {

                p256dh:
                    row.p256dh,

                auth:
                    row.auth

            }

        };


        try {

            await webPush.sendNotification(

                subscription,

                payload,

                {

                    TTL: 60,

                    urgency: "high"

                }

            );


            notificationsSent++;


            console.log(
                "✅ MANAGER DELIVERY PUSH SENT",
                {
                    subscriptionId:
                        row.id,

                    orderId:
                        notificationData.orderId

                }
            );

        }


        catch (error) {

            console.error(
                "❌ MANAGER DELIVERY PUSH ERROR:",
                {
                    subscriptionId:
                        row.id,

                    error:
                        error.message

                }
            );


            // ==========================================
            // REMOVE DEAD SUBSCRIPTION
            // ==========================================

            if (
                error.statusCode === 404 ||
                error.statusCode === 410
            ) {

                db.query(
                    `
                        DELETE FROM push_subscriptions
                        WHERE id = ?
                    `,
                    [row.id],
                    deleteErr => {

                        if (deleteErr) {

                            console.error(
                                "❌ FAILED TO DELETE DEAD MANAGER PUSH SUBSCRIPTION:",
                                deleteErr
                            );

                        }

                    }
                );

            }

        }

    }


    return {

        success:
            notificationsSent > 0,

        subscriptionsFound:
            rows.length,

        notificationsSent

    };

};

module.exports = {

    sendPushToDeliveryBoy,
    sendPushToManagers

};