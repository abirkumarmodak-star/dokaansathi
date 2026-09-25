const express = require("express");

const router = express.Router();
const db = require("../config/db");
console.log("✅ deliveryAssignmentRoutes loaded");
console.log("🔥🔥 ONLINE DEBUG VERSION = 2026-DEBUG-01 🔥🔥");
const {
    assignDeliveryBoy,
    getMyDeliveryOrders,
    cancelDelivery,
    acceptDelivery,
    pickupDelivery,
  staffAutoAssignWaitingDelivery,
    deliverDelivery,
    updateOnlineStatus,
    deliveryBoyHeartbeat,
    setDeliveryBoyLeave,
    settleCancellationCash,
    settleCashback
} = require("../controllers/deliveryAssignmentController");
console.log("assignDeliveryBoy =", assignDeliveryBoy);
console.log("getMyDeliveryOrders =", getMyDeliveryOrders);
console.log("cancelDelivery =", cancelDelivery);
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");


// ======================================================
// TEST ROUTE
// ======================================================


// এখানে নতুন test route
router.get("/online-status-test", (req, res) => {
    console.log("🟢 ONLINE STATUS TEST ROUTE HIT");

    res.json({
        success: true,
        message: "Online status route is working"
    });
});

router.get("/heartbeat-test", (req, res) => {
    console.log("🟢🟢 HEARTBEAT TEST ROUTE HIT 🟢🟢");

    res.json({
        success: true,
        message: "Heartbeat route is working"
    });
});
router.patch(
    "/leave",
    authMiddleware,
    requireRole("DeliveryBoy"),
    setDeliveryBoyLeave
);
router.get("/test", (req, res) => {

    console.log("🔥 DELIVERY ASSIGNMENT TEST ROUTE HIT");

    res.json({
        success: true,
        message: "Delivery Assignment Routes Working"
    });

});


// ======================================================
// ASSIGN DELIVERY BOY
// ======================================================
router.patch(
    "/heartbeat",
    authMiddleware,
    requireRole("DeliveryBoy"),
    deliveryBoyHeartbeat
);
// ======================================================
// 🤖 STAFF / MANAGER AUTO ASSIGN WAITING DELIVERY
// ======================================================

router.post(
    "/auto-assign-waiting",
    authMiddleware,
    requireRole("Manager"),
    staffAutoAssignWaitingDelivery
);
router.post(
    "/assign",
    authMiddleware,
    requireRole("Manager"),
    assignDeliveryBoy
);

router.patch(
    "/accept/:assignmentId",
    authMiddleware,
    requireRole("DeliveryBoy"),
    acceptDelivery
);
router.patch(
    "/pickup/:assignmentId",
    authMiddleware,
    requireRole("DeliveryBoy"),
    pickupDelivery
);
router.patch(
    "/deliver/:assignmentId",
    authMiddleware,
    requireRole("DeliveryBoy"),
    deliverDelivery
);
// ======================================================
// DELIVERY BOY MY ORDERS
// ======================================================
// ======================================================
// DELIVERY BOY GPS LOCATION
// ======================================================
// ======================================================
// DELIVERY BOY ONLINE / OFFLINE
// ======================================================

router.patch(
    "/online-status",
    updateOnlineStatus
);

router.get(
    "/my-orders",
    authMiddleware,
    requireRole("DeliveryBoy"),
    getMyDeliveryOrders
);
// ======================================================
// 💵 SETTLE CUSTOMER CANCELLATION CASH
// ======================================================

router.patch(
    "/settle-cancellation-cash",
    authMiddleware,
    requireRole("DeliveryBoy"),
    settleCancellationCash
);
// ======================================================
// 💰 SETTLE CUSTOMER CASHBACK
// ======================================================

router.patch(
    "/settle-cashback/:assignmentId",
    authMiddleware,
    requireRole("DeliveryBoy"),
    settleCashback
);
router.patch("/online-status-debug", (req, res) => {

    const deliveryBoyId = 29;
    const { online_status } = req.body;

    console.log("🟢 ONLINE STATUS DEBUG");
    console.log("Delivery Boy ID =", deliveryBoyId);
    console.log("Status =", online_status);

    const updateSQL = `
        UPDATE staff
        SET online_status = ?
        WHERE id = ?
        AND role = 'DeliveryBoy'
    `;

    db.query(
        updateSQL,
        [online_status, deliveryBoyId],
        (err, result) => {

            if (err) {
                console.log("❌ DEBUG UPDATE ERROR:", err);

                return res.status(500).json({
                    success: false,
                    error: err.sqlMessage || err.message
                });
            }

            console.log("✅ DEBUG DB UPDATE SUCCESS");
            console.log("Affected Rows =", result.affectedRows);

            res.json({
                success: true,
                deliveryBoyId: deliveryBoyId,
                online_status: online_status,
                affectedRows: result.affectedRows
            });
        }
    );
});
// ======================================================
// CANCEL DELIVERY
// ======================================================

router.patch(
    "/cancel/:assignmentId",
    authMiddleware,
    requireRole("DeliveryBoy"),
    cancelDelivery
);
console.log("🔥 REGISTERED DELIVERY ROUTES:");
router.stack.forEach((r) => {
    if (r.route) {
        console.log(
            Object.keys(r.route.methods).join(",").toUpperCase(),
            r.route.path
        );
    }
});


module.exports = router;