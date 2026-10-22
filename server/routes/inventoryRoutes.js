const express = require("express");

const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");
const inventoryReaders = [authMiddleware, requireRole("Owner", "Manager", "Kitchen")];
const inventoryManagers = [authMiddleware, requireRole("Owner", "Manager")];

const {
    getInventory,
    getLowStock,
    updateOpeningStock,
    updateStock
} = require("../controllers/inventoryController");

router.get("/", ...inventoryReaders, getInventory);

router.get("/low-stock", ...inventoryReaders, getLowStock);

router.post("/opening-stock", ...inventoryManagers, updateOpeningStock);

router.put("/update-stock", ...inventoryManagers, updateStock);

module.exports = router;
