const express = require("express");
const router = express.Router();
console.log("✅ orderItemRoutes loaded");
const {
    getOrderItems,
    createOrderItem,
    updateOrderItem,
    addOrderItem
} = require("../controllers/orderItemController");

// GET ALL ORDER ITEMS
router.get("/", getOrderItems);

// CREATE ORDER ITEM
router.post("/", createOrderItem);

// UPDATE ORDER ITEM
router.put("/update", updateOrderItem);
router.post(
    "/add",
    addOrderItem
);

module.exports = router;