const express = require("express");

const router = express.Router();

const {

    getShopSettings,

    updateShopSettings

} = require("../controllers/shopSettingsController");
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

router.get(

    "/",

    authMiddleware,

    requireRole("Owner"),

    getShopSettings

);

router.put(

    "/",

    authMiddleware,

    requireRole("Owner"),

    updateShopSettings

);

module.exports = router;
