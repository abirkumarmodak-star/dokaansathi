const express = require("express");

const router = express.Router();

const {
    getStaff,
    createStaff,
    staffLogin
} = require("../controllers/staffController");

const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");


// ======================================================
// STAFF LOGIN
// Public route
// ======================================================

router.post(
    "/login",
    staffLogin
);


// ======================================================
// GET ALL STAFF
// Owner only
// ======================================================

router.get(
    "/",
    authMiddleware,
    requireRole("owner"),
    getStaff
);


// ======================================================
// CREATE STAFF
// Owner only
// ======================================================

router.post(
    "/",
    authMiddleware,
    requireRole("owner"),
    createStaff
);


module.exports = router;