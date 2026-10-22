const db = require("../config/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { bootstrapFirstOwner } = require("../services/ownerBootstrap");
console.log("✅ USER CONTROLLER LOADED");

// ==============================
// GET ALL USERS
// ==============================
exports.getUsers = (req, res) => {

    const sql = `
        SELECT
            id,
            name,
            phone,
            role,
            language,
            created_at
        FROM users
    `;

    db.query(sql, (err, result) => {

        if (err) {
            return res.status(500).json({
                error: err
            });
        }

        res.status(200).json(result);

    });

};


// ==============================
// CREATE USER
// ==============================
// ==============================
// CREATE OWNER USER
// ==============================
exports.createOwnerBootstrap = async (req, res) => {

    try {

        const {
            name,
            phone,
            password,
            language
        } = req.body;

        // ==============================
        // VALIDATION
        // ==============================

        if (
            typeof name !== "string" || !name.trim() ||
            typeof phone !== "string" || !phone.trim() ||
            typeof password !== "string" || password.length < 6
        ) {

            return res.status(400).json({

                success: false,
                message: "Name, Phone and Password are required"

            });

        }

        // ==============================
        // CHECK PHONE
        // ==============================

        const hashedPassword = await bcrypt.hash(password, 12);
        const result = await bootstrapFirstOwner(db, {
            name: name.trim(),
            phone: phone.trim(),
            passwordHash: hashedPassword,
            language: language || "English"
        });

        if (!result.created) {
            return res.status(409).json({
                success: false,
                message: "Owner setup has already been completed"
            });
        }

        return res.status(201).json({
            success: true,
            message: "Owner Account Created Successfully"
        });

    }
    catch (error) {

        if (error.code === "OWNER_BOOTSTRAP_BUSY") {
            return res.status(409).json({ success: false, message: error.message });
        }

        console.error("Owner bootstrap failed.", error.code || "internal error");

        return res.status(500).json({

            success: false,
            message: "Server Error"

        });

    }

};


// ==============================
// LOGIN USER
// ==============================
// ==============================
// LOGIN USER
// ==============================
exports.loginUser = (req, res) => {

    console.log("🔥 LOGIN API CALLED");

    const { phone, password } = req.body;

    if (!phone || !password) {

        return res.status(400).json({
            success: false,
            message: "Phone and Password are required"
        });

    }

    const sql = `
        SELECT *
        FROM users
        WHERE phone = ?
    `;

    db.query(sql, [phone], async (err, result) => {

        if (err) {

            console.error("Login request failed.");

            return res.status(500).json({
                success: false,
                message: "Database Error"
            });

        }

        if (result.length === 0) {

            return res.status(401).json({
                success: false,
                message: "Phone not found"
            });

        }

        const user = result[0];

        // ==============================
        // CHECK PASSWORD
        // ==============================

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {

            return res.status(401).json({

                success: false,
                message: "Wrong Password"

            });

        }

        // ==============================
        // CREATE JWT
        // ==============================

        const token = jwt.sign(

            {
                id: user.id,
                role: user.role
            },

            process.env.JWT_SECRET,

            {
                expiresIn: "8h"
            }

        );

        // ==============================
        // LOGIN SUCCESS
        // ==============================

        return res.status(200).json({

            success: true,

            message: "Login Success",

            token,

            user: {

                id: user.id,
                name: user.name,
                phone: user.phone,
                role: user.role,
                language: user.language

            }

        });

    });

};
