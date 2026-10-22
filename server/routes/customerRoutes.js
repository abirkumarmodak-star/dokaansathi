const express = require("express");

const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

const customerController = require("../controllers/customerController");

router.post("/", customerController.createCustomer);

router.get("/", authMiddleware, requireRole("Owner", "Manager", "Counter"), customerController.getCustomers);

module.exports = router;
