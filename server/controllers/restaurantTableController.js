const db = require("../config/db");

// ======================================
// UPDATE TABLE STATUS
// ======================================

exports.updateTableStatus = (req, res) => {

    console.log("UPDATE TABLE STATUS API RUNNING");
 
    const {

        table_number,
        order_id

    } = req.body;

    // ==========================
    // VALIDATION
    // ==========================

    if (!table_number || !order_id) {

        return res.status(400).json({

            success: false,
            message: "Table Number and Order ID are required"

        });

    }

    const sql = `

        UPDATE restaurant_tables

        SET

            status = 'Occupied',

            current_order_id = ?

        WHERE table_number = ?

    `;

    db.query(

        sql,

        [

            order_id,

            table_number

        ],

        (err, result) => {

            if (err) {

                console.log("DATABASE ERROR :", err);

                return res.status(500).json({

                    success: false,
                    message: "Database Error"

                });

            }

            if (result.affectedRows === 0) {

                return res.status(404).json({

                    success: false,
                    message: "Table Not Found"

                });

            }

            return res.status(200).json({

                success: true,
                message: "Table Status Updated Successfully"

            });

        }

    );

};