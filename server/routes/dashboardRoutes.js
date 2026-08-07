const express = require("express");

const router = express.Router();

const {
    getDashboard
} = require("../controllers/dashboardController");

// ==============================
// Dashboard Summary
// ==============================

router.get("/", getDashboard);

module.exports = router;