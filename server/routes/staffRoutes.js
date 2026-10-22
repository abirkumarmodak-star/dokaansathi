"use strict";

const express = require("express");
const router = express.Router();
const {
    getStaff,
    createStaff,
    staffLogin,
    updateAvailability,
    resetStaffPassword,
    updateWorkingHours,
    updateStaffPhone
} = require("../controllers/staffController");
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");
const { createRateLimiter } = require("../middleware/rateLimit");
const staffLoginRateLimit = createRateLimiter({
    name: "staff-login",
    windowEnv: "LOGIN_RATE_LIMIT_WINDOW_MS",
    maxEnv: "LOGIN_RATE_LIMIT_MAX",
    defaultMax: 10
});

router.post("/login", staffLoginRateLimit, staffLogin);
router.get("/", authMiddleware, requireRole("Owner"), getStaff);
router.post("/reset-password", authMiddleware, requireRole("Owner"), resetStaffPassword);
router.post("/", authMiddleware, requireRole("Owner"), createStaff);
router.patch("/availability", authMiddleware, requireRole("DeliveryBoy"), updateAvailability);
router.patch("/:id/work-hours", authMiddleware, requireRole("Owner"), updateWorkingHours);
router.patch("/:id/phone", authMiddleware, requireRole("Owner"), updateStaffPhone);

module.exports = router;
