const express = require("express");
const router = express.Router();

console.log("✅ alertRoutes.js loaded");

router.use((req, res, next) => {

    console.log("ALERT ROUTE HIT:", req.method, req.url);

    next();

});

const {
    getAlerts,
    createAlert
} = require("../controllers/alertController");

router.get("/", getAlerts);

router.post("/", createAlert);

module.exports = router;