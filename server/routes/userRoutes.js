const express = require("express");

const router = express.Router();

console.log("✅ userRoutes.js loaded");

const userController = require("../controllers/userController");

console.log(userController);

// TEST
router.get("/test", (req, res) => {

    res.json({
        message: "User Route Working"
    });

});

// GET ALL USERS
router.get("/", userController.getUsers);

// CREATE USER
router.post("/", userController.createUser);

// LOGIN
router.post("/login", userController.loginUser);

module.exports = router;