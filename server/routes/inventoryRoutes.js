const express = require("express");

const router = express.Router();

const {
    getInventory,
    getLowStock,
    updateOpeningStock,
    updateStock
} = require("../controllers/inventoryController");

router.get("/", getInventory);

router.get("/low-stock", getLowStock);

router.post("/opening-stock", updateOpeningStock);

router.put("/update-stock", updateStock);

module.exports = router;