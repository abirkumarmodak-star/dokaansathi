const express = require("express");

const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

const {

    updateTableStatus

} = require("../controllers/restaurantTableController");

// ======================================
// UPDATE TABLE STATUS
// ======================================

router.patch(

    "/status",

    authMiddleware,

    requireRole("Owner", "Manager", "Waiter", "Counter"),

    updateTableStatus

);

module.exports = router;
