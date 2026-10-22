const Staff = require("../models/staffModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

console.log("✅ STAFF CONTROLLER LOADED");

// ======================================================
// GET ALL STAFF
// ======================================================

exports.getStaff = (req, res) => {

    console.log("🔥 GET STAFF CONTROLLER HIT");

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
    password,
    role,
    work_start_time,
    work_end_time
} = req.body;


        // ==================================================
        // VALIDATION
        // ==================================================

        if (!name || !phone || !password || !role) {

            return res.status(400).json({
                success: false,
                message:
                    "Name, Phone, Password and Role are required"
            });
        }


        // ==================================================
        // ALLOWED STAFF ROLES
        // Must match MySQL ENUM exactly
        // ==================================================

        const allowedRoles = [
            "Manager",
            "Counter",
            "Kitchen",
            "Waiter",
            "DeliveryBoy"
        ];

        if (!allowedRoles.includes(role)) {

            return res.status(400).json({
                success: false,
                message: "Invalid staff role"
            });
        }


        // ==================================================
        // PASSWORD LENGTH
        // ==================================================

        if (password.length < 6) {

            return res.status(400).json({
                success: false,
                message:
                    "Password must be at least 6 characters"
            });
        }


        // ==================================================
        // CHECK PHONE
        // ==================================================

        Staff.findByPhone(
            phone,
            async (checkErr, existingStaff) => {

                if (checkErr) {



                    return res.status(500).json({
                        success: false,
                        message: "Database Error"
                    });
                }


                if (
                    existingStaff &&
                    existingStaff.length > 0
                ) {

                    return res.status(409).json({
                        success: false,
                        message:
                            "This phone number is already registered"
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

    // Actual role
    role: role,

    // DeliveryBoy working hours
    work_start_time: role === "DeliveryBoy" ? work_start_time : null,
    work_end_time: role === "DeliveryBoy" ? work_end_time : null
},
                    (err, result) => {

                        if (err) {

















                            return res.status(500).json({
                                success: false,
                                message:
                                    "Staff Account Creation Failed"
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

                                role
                            }
                        });
                    }
                );
            }
        );

    }

    catch (error) {



















        return res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};

// ======================================================
// UPDATE DELIVERY BOY AVAILABILITY
// ======================================================

exports.updateAvailability = (req, res) => {

    console.log("====================================");
    console.log("🚚 UPDATE DELIVERY BOY AVAILABILITY");
    console.log("====================================");

    const { online_status } = req.body;

    // ==================================================
    // VALIDATION
    // ==================================================

    if (
        online_status !== "Online" &&
        online_status !== "Offline"
    ) {

        return res.status(400).json({
            success: false,
            message: "Invalid online status"
        });

    }

    // ==================================================
    // UPDATE ONLY LOGGED-IN DELIVERY BOY
    // ==================================================

    Staff.updateOnlineStatus(
        req.user.id,
        online_status,
        (err, result) => {

            if (err) {

                console.log(
                    "❌ UPDATE AVAILABILITY ERROR =",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: "Failed to update availability"
                });

            }

            console.log(
                "✅ AVAILABILITY UPDATED"
            );

            console.log(
                "DELIVERY BOY ID =",
                req.user.id
            );

            console.log(
                "ONLINE STATUS =",
                online_status
            );

            return res.status(200).json({

                success: true,

                message:
                    `Delivery Boy is now ${online_status}`,

                online_status

            });

        }
    );
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
            message:
                "Phone and Password Required"
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
            message:
                "Server Authentication Configuration Error"
        });
    }


    // ==================================================
    // FIND STAFF
    // ==================================================

    Staff.getStaffByPhone(
        phone,

        async (err, result) => {

            if (err) {

                console.log(
                    "❌ Staff Login DB Error:",
                    err
                );

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
                    message:
                        "Invalid Phone or Password"
                });
            }


            const staff = result[0];


            // ==================================================
            // CHECK ACTIVE STATUS
            // ==================================================

            if (staff.status !== "Active") {

                return res.status(403).json({
                    success: false,
                    message:
                        "Staff Account is Inactive"
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
                    message:
                        "Invalid Phone or Password"
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
// ===============================
// RESET STAFF PASSWORD
// TEMPORARY TEST FUNCTION
// ===============================
// ===============================
// UPDATE DELIVERY BOY WORKING HOURS
// Owner changes existing DeliveryBoy hours
// ===============================

exports.updateWorkingHours = (req, res) => {
    const staffId = Number(req.params.id);

    const { work_start_time, work_end_time } = req.body;

    console.log("========== UPDATE WORKING HOURS ==========");
    console.log("STAFF ID =", staffId);
    console.log("START TIME =", work_start_time);
    console.log("END TIME =", work_end_time);

    // Validate staff ID
    if (!Number.isInteger(staffId) || staffId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid staff ID"
        });
    }

    // Validate time fields
    if (!work_start_time || !work_end_time) {
        return res.status(400).json({
            success: false,
            message: "Work start time and work end time are required"
        });
    }

    // Validate HH:MM format
    const timeRegex = /^\d{2}:\d{2}$/;

    if (
        !timeRegex.test(work_start_time) ||
        !timeRegex.test(work_end_time)
    ) {
        return res.status(400).json({
            success: false,
            message: "Invalid time format. Use HH:MM"
        });
    }

    // Start time must be before end time
    if (work_start_time >= work_end_time) {
        return res.status(400).json({
            success: false,
            message: "Work start time must be earlier than work end time"
        });
    }

    Staff.updateWorkingHours(
        staffId,
        work_start_time,
        work_end_time,
        (err, result) => {

            if (err) {
                console.error("❌ UPDATE WORKING HOURS ERROR =", err);

                return res.status(500).json({
                    success: false,
                    message: "Failed to update working hours"
                });
            }

            // ID does not exist OR staff is not DeliveryBoy
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "DeliveryBoy not found"
                });
            }

            console.log("✅ WORKING HOURS UPDATED");

            return res.status(200).json({
                success: true,
                message: "Working hours updated successfully",
                staffId: staffId,
                work_start_time: work_start_time,
                work_end_time: work_end_time
            });
        }
    );
};
exports.resetStaffPassword = async (req, res) => {

    const { staffId, newPassword } = req.body;
    const numericStaffId = Number(staffId);

    if (!Number.isInteger(numericStaffId) || numericStaffId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid staff ID"
        });
    }

    if (!newPassword) {
        return res.status(400).json({
            success: false,
            message: "Staff ID and new password are required"
        });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({
            success: false,
            message: "Password must be at least 6 characters"
        });
    }

    try {

        const hashedPassword =
            await bcrypt.hash(newPassword, 12);

        Staff.updatePassword(
            numericStaffId,
            hashedPassword,
            (err, result) => {

                if (err) {


                    return res.status(500).json({
                        success: false,
                        message: "Password reset failed"
                    });
                }

                if (!result || !Number.isInteger(result.affectedRows) || result.affectedRows < 0) {
                    return res.status(500).json({
                        success: false,
                        message: "Password reset failed"
                    });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({
                        success: false,
                        message: "Staff not found"
                    });
                }

                return res.status(200).json({
                    success: true,
                    message: "Password reset successfully"
                });
            }
        );

    } catch (error) {



        return res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};

exports.updateStaffPhone = (req, res) => {
    const staffId = Number(req.params.id);
    const phone = String(req.body.phone || "").trim();

    if (!Number.isInteger(staffId) || staffId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid staff ID"
        });
    }

    if (!/^[0-9]{10,15}$/.test(phone)) {
        return res.status(400).json({
            success: false,
            message: "Enter a valid phone number (10–15 digits)"
        });
    }

    Staff.getStaffById(staffId, (staffErr, staffRows) => {
        if (staffErr) {
            return res.status(500).json({
                success: false,
                message: "Failed to find staff"
            });
        }

        const currentStaff = staffRows && staffRows[0];

        if (!currentStaff) {
            return res.status(404).json({
                success: false,
                message: "Staff not found"
            });
        }

        if (String(currentStaff.phone) === phone) {
            return res.status(200).json({
                success: true,
                message: "Phone number is already up to date"
            });
        }

        Staff.findByPhone(phone, (err, rows) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: "Failed to check phone number"
                });
            }

            const duplicate = (rows || []).some(
                staff => Number(staff.id) !== staffId
            );

            if (duplicate) {
                return res.status(409).json({
                    success: false,
                    message: "This phone number is already in use"
                });
            }

            Staff.updatePhone(staffId, phone, (updateErr, result) => {
                if (updateErr) {
                    if (updateErr.code === "ER_DUP_ENTRY" || updateErr.errno === 1062) {
                        return res.status(409).json({
                            success: false,
                            message: "This phone number is already in use"
                        });
                    }

                    return res.status(500).json({
                        success: false,
                        message: "Phone number update failed"
                    });
                }

                if (!result || !Number.isInteger(result.affectedRows) || result.affectedRows < 0) {
                    return res.status(500).json({
                        success: false,
                        message: "Phone number update failed"
                    });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({
                        success: false,
                        message: "Staff not found"
                    });
                }

                return res.status(200).json({
                    success: true,
                    message: "Phone number updated successfully"
                });
            });
        });
    });
};
