const express = require("express");
const router = express.Router();

console.log("✅ orderRoutes.js loaded");

router.use((req, res, next) => {
    console.log("ORDER ROUTE HIT:", req.method, req.url);
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
    getPendingPayments
);
router.get(
    "/pending",
    getPendingOrders
);
router.get(
    "/token/:token",
    getOrderByToken
);
router.get("/", getOrders);



router.post("/", createOrder);

router.post("/accept", acceptOrder);
router.put(
    "/accept-all",
    acceptAllOrders
);
router.put(
    "/preparing-all",
    preparingAllOrders
);
router.post("/preparing", preparingOrder);
router.post("/ready", readyOrder);
router.post("/complete", completeOrder);
router.put("/update", updateOrder);
router.put("/cancel", cancelOrder);
router.put(
    "/payment",
    receivePayment
);
module.exports = router;
