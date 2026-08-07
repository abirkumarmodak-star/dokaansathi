const express = require("express");

const router = express.Router();
console.log("✅ staffRoutes.js loaded");
const {

    getStaff,

    createStaff,
    staffLogin

} = require("../controllers/staffController");

// ===============================
// GET ALL STAFF
// ===============================

router.get("/", getStaff);

// ===============================
// ADD NEW STAFF
// ===============================

router.post("/", createStaff);
// ===============================
// STAFF LOGIN
// ===============================
router.post("/login", (req, res, next) => {
    console.log("🔥 STAFF LOGIN ROUTE HIT");
    next();
}, staffLogin);
router.post("/login", staffLogin);
module.exports = router;