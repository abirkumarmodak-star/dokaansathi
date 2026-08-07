const db = require("../config/db");

// ======================================
// GET ALL MENU ITEMS
// ======================================

exports.getMenu = (req, res) => {

    console.log("GET MENU API RUNNING");

    const sql = `
        SELECT
            id,
            name,
            category,
            half_price,
            full_price,
            available,
            serving_type,
            serving_size,
            display_order,
            image
        FROM menu
        ORDER BY
            category ASC,
            display_order ASC,
            name ASC
    `;

    db.query(sql, (err, results) => {

        if (err) {

            console.log("DATABASE ERROR:", err);

            return res.status(500).json({

                success: false,
                message: "Database Error"

            });

        }

        return res.status(200).json(results);

    });

};
// ======================================
// CREATE MENU ITEM
// ======================================

exports.createMenu = (req, res) => {

    console.log("CREATE MENU API RUNNING");

    const {

        name,
        category,
        half_price,
        full_price,
        available,
        serving_type,
        serving_size

    } = req.body;

    // ==========================
    // VALIDATION
    // ==========================

    if (

        !name ||
        !category ||
        full_price === undefined ||
        full_price === null

    ) {

        return res.status(400).json({

            success: false,

            message: "Name, Category and Full Price are required"

        });

    }

    const sql = `

        INSERT INTO menu
        (
            name,
            category,
            half_price,
            full_price,
            available,
            serving_type,
            serving_size
        )
        VALUES
        (?, ?, ?, ?, ?, ?, ?)

    `;

    db.query(

        sql,

        [

            name,
            category,
            half_price,
            full_price,
            available,
            serving_type,
            serving_size

        ],

        (err, result) => {

            if (err) {

                console.log("DATABASE ERROR:", err);

                return res.status(500).json({

                    success: false,

                    message: "Database Error"

                });

            }

            return res.status(201).json({

                success: true,

                message: "Menu Item Added Successfully",

                menuId: result.insertId

            });

        }

    );

};
// ======================================
// UPDATE MENU ITEM
// ======================================

exports.updateMenu = (req, res) => {

    console.log("UPDATE MENU API RUNNING");

    const { id } = req.params;

    const {

        name,
        category,
        half_price,
        full_price,
        available,
        serving_type,
        serving_size

    } = req.body;

    // ==========================
    // VALIDATION
    // ==========================

    if (

        !name ||
        !category ||
        full_price === undefined ||
        full_price === null

    ) {

        return res.status(400).json({

            success: false,

            message: "Name, Category and Full Price are required"

        });

    }

    const sql = `

        UPDATE menu

        SET

            name = ?,
            category = ?,
            half_price = ?,
            full_price = ?,
            available = ?,
            serving_type = ?,
            serving_size = ?

        WHERE id = ?

    `;

    db.query(

        sql,

        [

            name,
            category,
            half_price,
            full_price,
            available,
            serving_type,
            serving_size,
            id

        ],

        (err, result) => {

            if (err) {

                console.log("DATABASE ERROR:", err);

                return res.status(500).json({

                    success: false,

                    message: "Database Error"

                });

            }

            if (result.affectedRows === 0) {

                return res.status(404).json({

                    success: false,

                    message: "Food Not Found"

                });

            }

            return res.status(200).json({

                success: true,

                message: "Menu Item Updated Successfully"

            });

        }

    );

};
// ======================================
// DELETE MENU ITEM
// ======================================

exports.deleteMenu = (req, res) => {

    console.log("DELETE MENU API RUNNING");

    const { id } = req.params;

    const sql = `
        DELETE FROM menu
        WHERE id = ?
    `;

    db.query(sql, [id], (err, result) => {

        if (err) {

            console.log("DATABASE ERROR:", err);

            return res.status(500).json({

                success: false,

                message: "Database Error"

            });

        }

        if (result.affectedRows === 0) {

            return res.status(404).json({

                success: false,

                message: "Food Not Found"

            });

        }

        return res.status(200).json({

            success: true,

            message: "Food Deleted Successfully"

        });

    });

};
// ======================================
// TOGGLE MENU STATUS
// ======================================

exports.toggleMenuStatus = (req, res) => {

    console.log("TOGGLE MENU STATUS API RUNNING");

    const { id } = req.params;

    const getSql = `
        SELECT available
        FROM menu
        WHERE id = ?
    `;

    db.query(getSql, [id], (err, result) => {

    if (err) {

    console.log("========== CREATE MENU ERROR ==========");
    console.log(err);
    console.log("======================================");

    return res.status(500).json({
        success: false,
        message: "Database Error"
    });

}

        if (result.length === 0) {

            return res.status(404).json({

                success: false,

                message: "Food Not Found"

            });

        }

        const newStatus = result[0].available ? 0 : 1;

        const updateSql = `
            UPDATE menu
            SET available = ?
            WHERE id = ?
        `;

        db.query(updateSql, [newStatus, id], (updateErr) => {

            if (updateErr) {

                console.log("DATABASE ERROR:", updateErr);

                return res.status(500).json({

                    success: false,

                    message: "Database Error"

                });

            }

            return res.status(200).json({

                success: true,

                message: newStatus
                    ? "Food is now Available"
                    : "Food is now Unavailable",

                available: newStatus

            });

        });

    });

};
