const express = require("express");

const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");
const tableStaff = [authMiddleware, requireRole("Owner", "Manager", "Counter", "Waiter")];

console.log("✅ tableRoutes.js loaded");

// ==============================
// IMPORT CONTROLLER
// ==============================

const {

    getTables,

    getTableById,
    getTableByQR

} = require("../controllers/tableController");
// ==============================
console.log("getTables =", getTables);
console.log("getTableById =", getTableById);
console.log("getTableByQR=", getTableByQR);
// TABLE ROUTES
// ==============================

// Get All Tables
router.get(
    "/",
    ...tableStaff,
    getTables
);
router.get(
    "/qr/:qrCode",
    getTableByQR
);
// Get Single Table
router.get(
    "/:id",
    ...tableStaff,
    getTableById
);

module.exports = router;
