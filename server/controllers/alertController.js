const db = require("../config/db");

// =====================================
// GET ALL ALERTS
// =====================================

exports.getAlerts = (req, res) => {

    const sql = `
        SELECT *
        FROM alerts
        ORDER BY created_at DESC
    `;

    db.query(sql, (err, results) => {

        if (err) {

            console.log(err);

            return res.status(500).json({

                success: false,

                message: "Database Error"

            });

        }

        res.json({

            success: true,

            count: results.length,

            alerts: results

        });

    });

};
// =====================================
// CREATE ALERT
// =====================================

exports.createAlert = (req, res) => {

    const {

        order_id,

        user_type,

        alert_type,

        message

    } = req.body;

    if (

        !order_id ||

        !user_type ||

        !alert_type ||

        !message

    ) {

        return res.status(400).json({

            success: false,

            message: "All fields are required"

        });

    }

    const sql = `
        INSERT INTO alerts
        (
            order_id,
            user_type,
            alert_type,
            message
        )
        VALUES (?, ?, ?, ?)
    `;

    db.query(

        sql,

        [

            order_id,

            user_type,

            alert_type,

            message

        ],

        (err, result) => {

            if (err) {

                console.log(err);

                return res.status(500).json({

                    success: false,

                    message: "Database Error"

                });

            }

            res.status(201).json({

                success: true,

                message: "Alert Created Successfully",

                alert_id: result.insertId

            });

        }

    );

};