const express = require("express");

const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

const {
    getDashboard
} = require("../controllers/dashboardController");

// ==============================
// Dashboard Summary
// ==============================

router.get("/", authMiddleware, requireRole("Owner", "Manager"), getDashboard);

module.exports = router;
