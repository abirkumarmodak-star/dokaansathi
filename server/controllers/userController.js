const db = require("../config/db");
const jwt = require("jsonwebtoken");

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
exports.createUser = (req, res) => {

    const {
        name,
        phone,
        password,
        role,
        language
    } = req.body;

    const sql = `
        INSERT INTO users
        (
            name,
            phone,
            password,
            role,
            language
        )
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            name,
            phone,
            password,
            role,
            language
        ],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    error: err
                });
            }

            res.status(201).json({
                message: "User Created Successfully",
                userId: result.insertId
            });

        }
    );

};


// ==============================
// LOGIN USER
// ==============================
exports.loginUser = (req, res) => {

    console.log("🔥 LOGIN API CALLED");

    const { phone, password } = req.body;
    console.log("PHONE RECEIVED:", phone);
    console.log("PASSWORD RECEIVED:", password);
    const sql = `
        SELECT *
        FROM users
        WHERE phone = ?
    `;

    db.query(sql, [phone], (err, result) => {
     console.log(result);
        if (err) {
            console.log(err);

            return res.status(500).json({
                error: err
            });
        }

        if (result.length === 0) {

            return res.status(401).json({
                message: "Phone not found"
            });

        }

        const user = result[0];

        if (user.password !== password) {

            return res.status(401).json({
                message: "Wrong Password"
            });

        }

        console.log("Before JWT");

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

        console.log("Generated Token:");
        console.log(token);

        res.status(200).json({

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