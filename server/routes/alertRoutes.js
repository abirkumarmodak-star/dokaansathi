const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");
router.use(authMiddleware, requireRole("Owner", "Manager", "Kitchen", "Counter", "Waiter"));

console.log("✅ alertRoutes.js loaded");

router.use((req, res, next) => {

    next();

});

const {
    getAlerts,
    createAlert
} = require("../controllers/alertController");

router.get("/", getAlerts);

router.post("/", createAlert);

module.exports = router;
