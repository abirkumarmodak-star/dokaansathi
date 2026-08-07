console.log("✅ menuRoutes.js loaded");

const express = require("express");

const router = express.Router();

// ==============================
// IMPORT CONTROLLERS
// ==============================

const {

    getMenu,

    createMenu,

    updateMenu,

    deleteMenu,

    toggleMenuStatus

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

// Create Menu Item
// Owner Only

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

router.patch(

    "/toggle/:id",

    authMiddleware,

    toggleMenuStatus

);

module.exports = router;