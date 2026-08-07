const express = require("express");

const router = express.Router();

const {
    openShop,
    getShopStatus,
    closeShop
} = require("../controllers/shopController");

router.post("/open", openShop);

router.get("/status", getShopStatus);

router.post("/close", closeShop);

module.exports = router;
