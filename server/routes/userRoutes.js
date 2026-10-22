const express = require("express");

const router = express.Router();

console.log("✅ userRoutes.js loaded");

const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");
const { createRateLimiter } = require("../middleware/rateLimit");
const loginRateLimit = createRateLimiter({
    name: "user-login",
    windowEnv: "LOGIN_RATE_LIMIT_WINDOW_MS",
    maxEnv: "LOGIN_RATE_LIMIT_MAX",
    defaultMax: 10
});

console.log(userController);

// TEST
router.get("/test", authMiddleware, requireRole("Owner"), (req, res) => {

    res.json({
        message: "User Route Working"
    });

});

// GET ALL USERS
router.get("/", authMiddleware, requireRole("Owner"), userController.getUsers);

// CREATE USER
router.post("/bootstrap", userController.createOwnerBootstrap);

// LOGIN
router.post("/login", loginRateLimit, userController.loginUser);

module.exports = router;
