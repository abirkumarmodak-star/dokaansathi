const express = require("express");

const router = express.Router();

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
    toggleEmergency
);

module.exports = router;