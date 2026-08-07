const Staff = require("../models/staffModel");

// ===============================
// GET ALL STAFF
// ===============================

exports.getStaff = (req, res) => {

    Staff.getAllStaff((err, result) => {

        if (err) {

            console.log(err);

            return res.status(500).json({

                success: false,

                message: "Database Error"

            });

        }

        res.json({

            success: true,

            staff: result

        });

    });

};

// ===============================
// ADD NEW STAFF
// ===============================

exports.createStaff = (req, res) => {

    const {

        name,

        phone,

        password,

        role

    } = req.body;

    Staff.addStaff(

        {

            name,

            phone,

            password,

            role

        },

        (err, result) => {

            if (err) {

                console.log(err);

                return res.status(500).json({

                    success: false,

                    message: "Database Error"

                });

            }

            res.json({

                success: true,

                message: "Staff Added Successfully"

            });

        }

    );

};
// ===============================
// STAFF LOGIN
// ===============================

exports.staffLogin = (req, res) => {

    const { phone, password } = req.body;

    if (!phone || !password) {

        return res.status(400).json({

            success: false,

            message: "Phone and Password Required"

        });

    }

    Staff.loginStaff(

        phone,

        password,

        (err, result) => {

            if (err) {

                console.log(err);

                return res.status(500).json({

                    success: false,

                    message: "Database Error"

                });

            }

            if (result.length === 0) {

                return res.json({

                    success: false,

                    message: "Invalid Phone or Password"

                });

            }

            res.json({

                success: true,

                message: "Login Successful",

                staff: result[0]

            });

        }

    );

};