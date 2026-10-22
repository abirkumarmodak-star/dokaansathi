const express = require("express");

const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

const {
    getStatus,
    toggleEmergency
} = require("../controllers/whatsappController");

// ===============================
// Get Emergency Status
// ===============================
router.get(
    "/status",
    getStatus
);

// ===============================
// Toggle Emergency Mode
// ===============================
router.put(
    "/toggle",
    authMiddleware,
    requireRole("Owner", "Manager"),
    toggleEmergency
);

module.exports = router;
