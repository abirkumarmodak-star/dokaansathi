const db = require("../config/db");

// ===============================
// GET SHOP SETTINGS
// ===============================

exports.getShopSettings = (req, res) => {

    const sql = `
        SELECT *
        FROM shop_settings
        LIMIT 1
    `;

    db.query(sql, (err, result) => {

        if (err) {

            console.log(err);

            return res.status(500).json({

                success: false,
                message: "Database Error"

            });

        }

        res.json({

            success: true,
            settings: result[0]

        });

    });

};
// ===============================
// UPDATE SHOP SETTINGS
// ===============================

exports.updateShopSettings = (req, res) => {

    const {

        shop_name,
        owner_name,
        phone,
        upi_id,
        language

    } = req.body;

    const sql = `

        UPDATE shop_settings

        SET

        shop_name=?,

        owner_name=?,

        phone=?,

        upi_id=?,

        language=?

        WHERE id=1

    `;

    db.query(

        sql,

        [

            shop_name,

            owner_name,

            phone,

            upi_id,

            language

        ],

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

                message: "Shop Settings Updated Successfully"

            });

        }

    );

};