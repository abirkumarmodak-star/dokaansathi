const express = require("express");

const router = express.Router();

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
    getTables
);
router.get(
    "/qr/:qrCode",
    getTableByQR
);
// Get Single Table
router.get(
    "/:id",
    getTableById
);

module.exports = router;