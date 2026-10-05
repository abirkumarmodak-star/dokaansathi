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
    authMiddleware,
    createCombo
);
router.post(

    "/",

    authMiddleware,

    createMenu

);

// Update Menu Item
// Owner Only

router.put(

    "/:id",

    authMiddleware,

    updateMenu

);

// Delete Menu Item
// Owner Only

router.delete(

    "/:id",

    authMiddleware,

    deleteMenu

);

// Toggle Available / Unavailable
// Owner Only
// Make All Menu Items Unavailable
// Owner Only

router.patch(
    "/make-all-unavailable",
    authMiddleware,
    makeAllMenuUnavailable
);
router.patch(

    "/toggle/:id",

    authMiddleware,

    toggleMenuStatus

);

module.exports = router;