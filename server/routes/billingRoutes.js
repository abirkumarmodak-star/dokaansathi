const express = require("express");

const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");
router.use(authMiddleware, requireRole("Owner", "Manager", "Counter"));

const {
    getBill,
    payBill,
    getInvoice
} = require("../controllers/billingController");

// GET BILL
router.get("/:order_id", getBill);

// PAYMENT
router.put("/pay", payBill);
// GET INVOICE
router.get("/invoice/:order_id", getInvoice);
module.exports = router;
