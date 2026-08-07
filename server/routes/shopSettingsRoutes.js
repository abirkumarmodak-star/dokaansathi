const express = require("express");

const router = express.Router();

const {

    getShopSettings,

    updateShopSettings

} = require("../controllers/shopSettingsController");

router.get(

    "/",

    getShopSettings

);

router.put(

    "/",

    updateShopSettings

);

module.exports = router;