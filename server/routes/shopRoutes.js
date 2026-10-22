const express = require("express");

const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

const {
    openShop,
    getShopStatus,
    closeShop
} = require("../controllers/shopController");

router.post("/open", authMiddleware, requireRole("Owner", "Manager"), openShop);

router.get("/status", getShopStatus);

router.post("/close", authMiddleware, requireRole("Owner", "Manager"), closeShop);

module.exports = router;
