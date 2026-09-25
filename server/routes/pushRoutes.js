const express = require("express");
const router = express.Router();
const webPush = require("../config/webPush");
const db = require("../config/db");

// ==========================================
// SAVE PUSH SUBSCRIPTION
// ==========================================

router.post("/subscribe", (req, res) => {

    const {
        staff_id,
        subscription
    } = req.body;

    if (
        !staff_id ||
        !subscription ||
        !subscription.endpoint ||
        !subscription.keys ||
        !subscription.keys.p256dh ||
        !subscription.keys.auth
    ) {

        return res.status(400).json({
            success: false,
            message:
                "Invalid push subscription data"
        });
    }

    const sql = `
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
        sql,
        [
            staff_id,
            subscription.endpoint,
            subscription.keys.p256dh,
            subscription.keys.auth
        ],
        (err, result) => {

            if (err) {

                console.error(
                    "❌ PUSH SUBSCRIPTION SAVE ERROR:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Failed to save push subscription",
                    error:
                        err.message
                });
            }

            return res.json({
                success: true,
                message:
                    "Push subscription saved successfully"
            });
        }
    );
});
// ==========================================
// 🧪 TEST PUSH NOTIFICATION
// ==========================================

router.post("/test/:staffId", (req, res) => {

    const staffId = Number(req.params.staffId);

    if (!staffId) {
        return res.status(400).json({
            success: false,
            message: "Invalid staff ID"
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
                    message: "Failed to find push subscription",
                    error: err.message
                });
            }

            if (!rows.length) {
                return res.status(404).json({
                    success: false,
                    message: "No push subscription found for this staff"
                });
            }

            const payload = JSON.stringify({
                title: "🔔 DokaanSathi TEST",
                body: "Test 2: DeliveryBoy notification check.",
                icon: "/favicon.svg",
                badge: "/favicon.svg",
                tag: "dokaansathi-test-2",
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
                        "❌ TEST PUSH ERROR:",
                        error.message
                    );
                }
            }

            return res.json({
                success: successCount > 0,
                message:
                    successCount > 0
                        ? "Test push sent successfully"
                        : "Test push failed",
                subscriptions_found: rows.length,
                notifications_sent: successCount
            });
        }
    );
});
module.exports = router;