const Staff = require("../models/staffModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

console.log("✅ STAFF CONTROLLER LOADED");

// ======================================================
// GET ALL STAFF
// ======================================================

exports.getStaff = (req, res) => {

    Staff.getAllStaff((err, result) => {

        if (err) {

            console.log("❌ Get Staff Error:", err);

            return res.status(500).json({
                success: false,
                message: "Database Error"
            });
        }

        // Never send password to frontend
        const safeStaff = result.map((staff) => {

            const {
                password,
                ...staffWithoutPassword
            } = staff;

            return staffWithoutPassword;
        });

        return res.status(200).json({
            success: true,
            staff: safeStaff
        });
    });
};


// ======================================================
// CREATE STAFF ACCOUNT
// ======================================================

exports.createStaff = async (req, res) => {

    try {

        const {
            name,
            phone,
            password
        } = req.body;


        // ==================================================
        // VALIDATION
        // ==================================================

        if (!name || !phone || !password) {

            return res.status(400).json({
                success: false,
                message: "Name, Phone and Password are required"
            });
        }


        // ==================================================
        // PASSWORD LENGTH
        // ==================================================

        if (password.length < 6) {

            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters"
            });
        }


        // ==================================================
        // CHECK PHONE
        // ==================================================

        Staff.findByPhone(phone, async (checkErr, existingStaff) => {

            if (checkErr) {

                console.log("❌ Phone Check Error:", checkErr);

                return res.status(500).json({
                    success: false,
                    message: "Database Error"
                });
            }


            if (existingStaff && existingStaff.length > 0) {

                return res.status(409).json({
                    success: false,
                    message: "This phone number is already registered"
                });
            }


            // ==================================================
            // HASH PASSWORD
            // ==================================================

            const hashedPassword =
                await bcrypt.hash(password, 12);


            // ==================================================
            // CREATE STAFF
            // ==================================================

            Staff.addStaff(
                {
                    name,
                    phone,
                    password: hashedPassword,

                    // Never allow client to create owner
                    role: "staff"
                },

                (err, result) => {

                    if (err) {

                        console.log(
                            "❌ Staff Creation Error:",
                            err
                        );

                        return res.status(500).json({
                            success: false,
                            message: "Staff Account Creation Failed"
                        });
                    }


                    // ==================================================
                    // SUCCESS
                    // ==================================================

                    return res.status(201).json({

                        success: true,

                        message:
                            "Staff Account Created Successfully",

                        staff: {

                            id: result.insertId,

                            name,

                            phone,

                            role: "staff"
                        }
                    });
                }
            );
        });

    }

    catch (error) {

        console.log("❌ Create Staff Error:", error);

        return res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};


// ======================================================
// STAFF LOGIN
// ======================================================

exports.staffLogin = (req, res) => {

    const {
        phone,
        password
    } = req.body;


    // ==================================================
    // VALIDATION
    // ==================================================

    if (!phone || !password) {

        return res.status(400).json({
            success: false,
            message: "Phone and Password Required"
        });
    }


    // ==================================================
    // CHECK JWT SECRET
    // ==================================================

    if (!process.env.JWT_SECRET) {

        console.error(
            "❌ JWT_SECRET is missing from environment variables"
        );

        return res.status(500).json({
            success: false,
            message: "Server Authentication Configuration Error"
        });
    }


    // ==================================================
    // FIND STAFF
    // ==================================================

    Staff.getStaffByPhone(
        phone,

        async (err, result) => {

            if (err) {

                console.log("❌ Staff Login DB Error:", err);

                return res.status(500).json({
                    success: false,
                    message: "Database Error"
                });
            }


            // ==================================================
            // STAFF NOT FOUND
            // ==================================================

            if (!result || result.length === 0) {

                return res.status(401).json({
                    success: false,
                    message: "Invalid Phone or Password"
                });
            }


            const staff = result[0];


            // ==================================================
            // CHECK ACTIVE STATUS
            // ==================================================

            if (staff.status !== "Active") {

                return res.status(403).json({
                    success: false,
                    message: "Staff Account is Inactive"
                });
            }


            // ==================================================
            // CHECK PASSWORD
            // ==================================================

            const passwordMatch =
                await bcrypt.compare(
                    password,
                    staff.password
                );


            if (!passwordMatch) {

                return res.status(401).json({
                    success: false,
                    message: "Invalid Phone or Password"
                });
            }


            // ==================================================
            // CREATE JWT
            // ==================================================

            const token = jwt.sign(

                {
                    id: staff.id,
                    role: staff.role
                },

                process.env.JWT_SECRET,

                {
                    expiresIn: "8h"
                }
            );


            // ==================================================
            // LOGIN SUCCESS
            // ==================================================

            return res.status(200).json({

                success: true,

                message: "Login Successful",

                token,

                staff: {

                    id: staff.id,

                    name: staff.name,

                    phone: staff.phone,

                    role: staff.role,

                    status: staff.status
                }
            });
        }
    );
};