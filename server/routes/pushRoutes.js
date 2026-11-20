
const express = require("express");
const router = express.Router();

const webPush = require("../config/webPush");
const db = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

// ==========================================
// SAVE PUSH SUBSCRIPTION
// One endpoint = one Staff ID
// Multiple endpoints per Staff ID allowed
// ==========================================

router.post("/subscribe", authMiddleware, (req, res) => {

    const staffId = Number(req.user?.id);

    const { staff_id, subscription } = req.body;

    if (!staffId || !Number.isInteger(staffId)) {
        return res.status(401).json({
            success: false,
            message: "Invalid authenticated staff"
        });
    }

    // Request body Staff ID must match JWT Staff ID
    if (Number(staff_id) !== staffId) {
        return res.status(403).json({
            success: false,
            message: "Staff ID does not match authenticated user"
        });
    }

    if (
        !subscription ||
        !subscription.endpoint ||
        !subscription.keys ||
        !subscription.keys.p256dh ||
        !subscription.keys.auth
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid push subscription data"
        });
    }

    const endpoint = subscription.endpoint;

    // Remove this endpoint from every OTHER Staff ID.
    // Keep other devices belonging to the same Staff ID.
    const deleteSql = `
        DELETE FROM push_subscriptions
        WHERE endpoint = ?
        AND staff_id <> ?
    `;

    db.query(
        deleteSql,
        [endpoint, staffId],
        (deleteErr) => {

            if (deleteErr) {
                console.error(
                    "PUSH ENDPOINT CLEANUP ERROR:",
                    deleteErr.message
                );

                return res.status(500).json({
                    success: false,
                    message: "Failed to update push endpoint ownership"
                });
            }

            const insertSql = `
                INSERT INTO push_subscriptions
                (
                    staff_id,
                    endpoint,
                    p256dh,
                    auth
                )
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    p256dh = VALUES(p256dh),
                    auth = VALUES(auth)
            `;

            db.query(
                insertSql,
                [
                    staffId,
                    endpoint,
                    subscription.keys.p256dh,
                    subscription.keys.auth
                ],
                (insertErr) => {

                    if (insertErr) {
                        console.error(
                            "PUSH SUBSCRIPTION SAVE ERROR:",
                            insertErr.message
                        );

                        return res.status(500).json({
                            success: false,
                            message: "Failed to save push subscription"
                        });
                    }

                    return res.json({
                        success: true,
                        message: "Push subscription saved successfully",
                        staff_id: staffId
                    });
                }
            );
        }
    );
});


// ==========================================
// TEST PUSH NOTIFICATION
// Staff can test only their own subscription
// ==========================================

router.post("/test/:staffId", authMiddleware, (req, res) => {

    const staffId = Number(req.params.staffId);
    const authenticatedStaffId = Number(req.user?.id);

    if (
        !staffId ||
        !Number.isInteger(staffId) ||
        staffId !== authenticatedStaffId
    ) {
        return res.status(403).json({
            success: false,
            message: "You can test only your own push subscription"
        });
    }

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
        [staffId],
        async (err, rows) => {

            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Failed to find push subscription"
                });
            }

            if (!rows.length) {
                return res.status(404).json({
                    success: false,
                    message: "No push subscription found for this staff"
                });
            }

            const payload = JSON.stringify({
                title: "DokaanSathi TEST",
                body: "DeliveryBoy notification check.",
                icon: "/favicon.svg",
                badge: "/favicon.svg",
                tag: "dokaansathi-test",
                url: "/staff-dashboard"
            });

            let successCount = 0;

            for (const row of rows) {

                const subscription = {
                    endpoint: row.endpoint,
                    keys: {
                        p256dh: row.p256dh,
                        auth: row.auth
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

                    successCount++;

                } catch (error) {

                    console.error(
                        "TEST PUSH ERROR:",
                        error.message
                    );
                }
            }

            return res.json({
                success: successCount > 0,
                message: successCount > 0
                    ? "Test push sent successfully"
                    : "Test push failed",
                subscriptions_found: rows.length,
                notifications_sent: successCount
            });
        }
    );
});

module.exports = router;
