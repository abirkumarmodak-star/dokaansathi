console.log("✅ menuRoutes.js loaded");

const express = require("express");

const router = express.Router();

// ==============================
// IMPORT CONTROLLERS
// ==============================

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

// ==============================
// JWT MIDDLEWARE
// ==============================

const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");
const ownerOrManager = [authMiddleware, requireRole("Owner", "Manager")];
// ==============================
// MENU ROUTES
// ==============================

// Get All Menu
// Customer + Owner + Staff

router.get(

    "/",

    getMenu

);
// Get All Combos
// Customer + Owner + Staff

router.get(
    "/combos",
    getCombos
);
// Create Menu Item
// Owner Only
// Create Combo
// Owner Only

router.post(
    "/combos",
    ...ownerOrManager,
    createCombo
);
router.put(
    "/combos/:id",
    ...ownerOrManager,
    updateCombo
);
router.delete(
    "/combos/:id",
    ...ownerOrManager,
    deleteCombo
);
router.post(

    "/",

    ...ownerOrManager,

    createMenu

);

// Update Menu Item
// Owner Only

router.put(

    "/:id",

    ...ownerOrManager,

    updateMenu

);

// Delete Menu Item
// Owner Only

router.delete(

    "/:id",

    ...ownerOrManager,

    deleteMenu

);

// Toggle Available / Unavailable
// Owner Only
// Make All Menu Items Unavailable
// Owner Only

router.patch(
    "/make-all-unavailable",
    ...ownerOrManager,
    makeAllMenuUnavailable
);
router.patch(

    "/toggle/:id",

    ...ownerOrManager,

    toggleMenuStatus

);

module.exports = router;
