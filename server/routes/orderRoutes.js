const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");
const { createRateLimiter } = require("../middleware/rateLimit");
const trackingRateLimit = createRateLimiter({
    name: "tracking",
    windowEnv: "TRACKING_RATE_LIMIT_WINDOW_MS",
    maxEnv: "TRACKING_RATE_LIMIT_MAX",
    defaultMax: 60
});
const cancellationRateLimit = createRateLimiter({
    name: "cancellation",
    windowEnv: "CANCEL_RATE_LIMIT_WINDOW_MS",
    maxEnv: "CANCEL_RATE_LIMIT_MAX",
    defaultMax: 10
});
const orderReaders = [authMiddleware, requireRole("Owner", "Manager", "Kitchen", "Counter", "Waiter")];
const orderManagers = [authMiddleware, requireRole("Owner", "Manager", "Kitchen", "Counter", "Waiter")];
const paymentManagers = [authMiddleware, requireRole("Owner", "Manager", "Counter")];

console.log("✅ orderRoutes.js loaded");

router.use((req, res, next) => {
    next();
});

const {
    getOrders,
    createOrder,
    acceptOrder,
    acceptAllOrders,
    preparingAllOrders,
    readyOrder,
   completeOrder,
    updateOrder,
    cancelOrder,
    receivePayment,
    getPendingPayments,
    getPendingOrders,
    preparingOrder,
    getOrderByToken
} = require("../controllers/orderController");
router.get(
    "/pending-payment",
    ...paymentManagers,
    getPendingPayments
);
router.get(
    "/pending",
    ...orderReaders,
    getPendingOrders
);
router.get(
    "/token/:token",
    trackingRateLimit,
    getOrderByToken
);
router.get("/", ...orderReaders, getOrders);



router.post("/", createOrder);

router.post("/accept", ...orderManagers, acceptOrder);
router.put(
    "/accept-all",
    ...orderManagers,
    acceptAllOrders
);
router.put(
    "/preparing-all",
    ...orderManagers,
    preparingAllOrders
);
router.post("/preparing", ...orderManagers, preparingOrder);
router.post("/ready", ...orderManagers, readyOrder);
router.post("/complete", ...orderManagers, completeOrder);
router.put("/update", ...orderManagers, updateOrder);
router.put("/cancel", cancellationRateLimit, cancelOrder);
router.put(
    "/payment",
    ...paymentManagers,
    receivePayment
);
module.exports = router;
