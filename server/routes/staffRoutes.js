const express = require("express");

const router = express.Router();

const {
    getStaff,
    createStaff,
    staffLogin,
    updateAvailability,
    resetStaffPassword
} = require("../controllers/staffController");

const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");


// ======================================================
// DEBUG
// ======================================================

console.log("🔥🔥🔥 STAFF ROUTER FILE ACTIVE 🔥🔥🔥");


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

    (req, res, next) => {

        console.log("🟢 [STAFF-1] STAFF GET ROUTE HIT");
        console.log(
            "🟢 [STAFF-1] AUTH HEADER =",
            req.headers.authorization
        );
        console.log("METHOD =", req.method);
        console.log("URL =", req.originalUrl);

        next();
    },

    authMiddleware,

    (req, res, next) => {

        console.log("🟢 [STAFF-2] AFTER AUTH");
        console.log("🟢 [STAFF-2] REQ.USER =", req.user);

        next();
    },

    requireRole("Owner"),

    (req, res, next) => {

        console.log("🟢 [STAFF-3] AFTER ROLE");

        next();
    },

    getStaff
);


// ======================================================
// CREATE STAFF
// Owner only
// ======================================================
router.post(
    "/reset-password",
    authMiddleware,
    requireRole("Owner"),
    resetStaffPassword
);
router.post(
    "/",

    authMiddleware,

    (req, res, next) => {

        console.log("🔥🔥 CREATE STAFF ROUTE REACHED");
        console.log("REQ.USER =", req.user);
        console.log("REQ.BODY =", req.body);

        next();
    },

    requireRole("Owner"),

    (req, res, next) => {

        console.log("🔥🔥 AFTER ROLE CHECK");
        console.log("REQ.USER =", req.user);

        next();
    },

    createStaff
);


// ======================================================
// DELIVERY BOY ONLINE / OFFLINE
// DeliveryBoy only
// ======================================================

router.patch(
    "/availability",

    authMiddleware,

    requireRole("DeliveryBoy"),

    updateAvailability
);


// ======================================================
// EXPORT ROUTER
// ======================================================

module.exports = router;