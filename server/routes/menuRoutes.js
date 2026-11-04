console.log("menuRoutes.js loaded");

const express = require("express");
const router = express.Router();

const {
    getMenu,
    getCombos,
    createCombo,
    updateCombo,
    deleteCombo,
    createMenu,
    updateMenu,
    deleteMenu,
    toggleMenuStatus,
    makeAllMenuUnavailable
} = require("../controllers/menuController");

const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

// Public read-only routes
router.get("/", getMenu);
router.get("/combos", getCombos);

// Combo management: Owner only
router.post("/combos", authMiddleware, requireRole("Owner", "owner"), createCombo);
router.put("/combos/:id", authMiddleware, requireRole("Owner", "owner"), updateCombo);
router.delete("/combos/:id", authMiddleware, requireRole("Owner", "owner"), deleteCombo);

// Menu management: Owner only
router.post("/", authMiddleware, requireRole("Owner", "owner"), createMenu);
router.put("/:id", authMiddleware, requireRole("Owner", "owner"), updateMenu);
router.delete("/:id", authMiddleware, requireRole("Owner", "owner"), deleteMenu);
router.patch("/make-all-unavailable", authMiddleware, requireRole("Owner", "owner"), makeAllMenuUnavailable);
router.patch("/toggle/:id", authMiddleware, requireRole("Owner", "owner"), toggleMenuStatus);

module.exports = router;
