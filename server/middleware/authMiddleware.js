"use strict";

const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
    const authHeader = req.headers && req.headers.authorization;
    const parts = typeof authHeader === "string" ? authHeader.split(" ") : [];

    if (parts.length !== 2 || parts[0] !== "Bearer" || !parts[1]) {
        return res.status(401).json({ success: false, message: "Authentication required" });
    }

    try {
        req.user = jwt.verify(parts[1], process.env.JWT_SECRET);
        return next();
    } catch {
        return res.status(401).json({ success: false, message: "Invalid or expired authentication token" });
    }
}

module.exports = authMiddleware;
