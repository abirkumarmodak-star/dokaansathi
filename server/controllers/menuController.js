const db = require("../config/db");

// ======================================
// GET ALL MENU ITEMS
// ======================================

exports.getMenu = (req, res) => {

    console.log("GET MENU API RUNNING");

    const sql = `
        SELECT
            menu.id,
            menu.name,
            menu.category,
            menu.half_price,
            menu.full_price,
            menu.available,
            menu.serving_type,
            menu.serving_size,
            menu.display_order,
            menu.image,

            inventory.current_stock

        FROM menu

        LEFT JOIN inventory
            ON inventory.menu_id = menu.id

        ORDER BY
            menu.category ASC,
            menu.display_order ASC,
            menu.name ASC
    `;

    db.query(sql, (err, results) => {

        if (err) {

            console.log("DATABASE ERROR:", err);

            return res.status(500).json({

                success: false,
                message: "Database Error"

            });

        }

        console.log("MENU + INVENTORY DATA:", results);

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
// ======================================
// GET ALL COMBOS
// ======================================

exports.getCombos = (req, res) => {

    console.log("GET COMBOS API RUNNING");

    const sql = `
        SELECT
            c.id,
            c.item1_id,
            c.item2_id,
            c.combo_price,
            c.is_preferred,
            c.available,

            m1.name AS item1_name,
            m1.full_price AS item1_price,

            m2.name AS item2_name,
            m2.full_price AS item2_price

        FROM combos c

        INNER JOIN menu m1
            ON m1.id = c.item1_id

        INNER JOIN menu m2
            ON m2.id = c.item2_id

        ORDER BY c.id DESC
    `;

    db.query(sql, (err, results) => {

        if (err) {

            console.log("COMBO DATABASE ERROR:", err);

            return res.status(500).json({
                success: false,
                message: "Database Error"
            });

        }

        console.log("COMBO DATA:", results);

        return res.status(200).json({
            success: true,
            combos: results
        });

    });

};
// ======================================
// CREATE COMBO
// ======================================

exports.createCombo = (req, res) => {

    console.log("CREATE COMBO API RUNNING");

    const {
        item1_id,
        item2_id,
        combo_price,
        is_preferred
    } = req.body;

    // ==========================
    // VALIDATION
    // ==========================

    if (
        !item1_id ||
        !item2_id ||
        combo_price === undefined ||
        combo_price === null
    ) {
        return res.status(400).json({
            success: false,
            message: "Two food items and Combo Price are required"
        });
    }

    if (Number(item1_id) === Number(item2_id)) {
        return res.status(400).json({
            success: false,
            message: "A combo must contain two different food items"
        });
    }

    if (Number(combo_price) <= 0) {
        return res.status(400).json({
            success: false,
            message: "Combo Price must be greater than 0"
        });
    }

    // ==========================
    // CHECK BOTH MENU ITEMS
    // ==========================

    const sql = `
        SELECT id, name, available
        FROM menu
        WHERE id IN (?, ?)
    `;

    db.query(
        sql,
        [item1_id, item2_id],
        (err, results) => {

            if (err) {

                console.log("COMBO MENU CHECK ERROR:", err);

                return res.status(500).json({
                    success: false,
                    message: "Database Error"
                });

            }

            if (results.length !== 2) {

                return res.status(404).json({
                    success: false,
                    message: "One or both food items were not found"
                });

            }

            // ==========================
            // CREATE COMBO
            // ==========================

            const insertSql = `
                INSERT INTO combos
                (
                    item1_id,
                    item2_id,
                    combo_price,
                    is_preferred,
                    available
                )
                VALUES (?, ?, ?, ?, 1)
            `;

            db.query(
                insertSql,
                [
                    item1_id,
                    item2_id,
                    combo_price,
                    is_preferred ? 1 : 0
                ],
                (insertErr, result) => {

                    if (insertErr) {

                        console.log(
                            "CREATE COMBO DATABASE ERROR:",
                            insertErr
                        );

                        return res.status(500).json({
                            success: false,
                            message: "Database Error"
                        });

                    }

                    return res.status(201).json({
                        success: true,
                        message: "Combo Created Successfully",
                        comboId: result.insertId
                    });

                }
            );

        }
    );

};
// ======================================
// MAKE ALL MENU ITEMS UNAVAILABLE
// ======================================
exports.updateCombo = (req, res) => {
    console.log("UPDATE COMBO API RUNNING");

    const comboId = req.params.id;

    const {
        item1_id,
        item2_id,
        combo_price,
        is_preferred
    } = req.body;

    if (!item1_id || !item2_id) {
        return res.status(400).json({
            success: false,
            message: "Both combo items are required"
        });
    }

    if (Number(item1_id) === Number(item2_id)) {
        return res.status(400).json({
            success: false,
            message: "Item 1 and Item 2 cannot be the same"
        });
    }

    if (!combo_price || Number(combo_price) <= 0) {
        return res.status(400).json({
            success: false,
            message: "Please enter a valid combo price"
        });
    }

    const checkSql = `
        SELECT id, name
        FROM menu
        WHERE id IN (?, ?)
    `;

    db.query(
        checkSql,
        [item1_id, item2_id],
        (err, results) => {

            if (err) {
                console.log("COMBO ITEM CHECK ERROR:", err);

                return res.status(500).json({
                    success: false,
                    message: "Database Error"
                });
            }

            if (results.length !== 2) {
                return res.status(400).json({
                    success: false,
                    message: "One or both menu items not found"
                });
            }

            const updateSql = `
                UPDATE combos
                SET
                    item1_id = ?,
                    item2_id = ?,
                    combo_price = ?,
                    is_preferred = ?
                WHERE id = ?
            `;

            db.query(
                updateSql,
                [
                    item1_id,
                    item2_id,
                    combo_price,
                    is_preferred ? 1 : 0,
                    comboId
                ],
                (err, result) => {

                    if (err) {
                        console.log("UPDATE COMBO DATABASE ERROR:", err);

                        return res.status(500).json({
                            success: false,
                            message: "Database Error"
                        });
                    }

                    if (result.affectedRows === 0) {
                        return res.status(404).json({
                            success: false,
                            message: "Combo not found"
                        });
                    }

                    return res.status(200).json({
                        success: true,
                        message: "Combo updated successfully"
                    });

                }
            );

        }
    );
};
exports.deleteCombo = (req, res) => {
    console.log("DELETE COMBO API RUNNING");

    const comboId = req.params.id;

    if (!comboId) {
        return res.status(400).json({
            success: false,
            message: "Combo ID is required"
        });
    }

    const sql = `
        DELETE FROM combos
        WHERE id = ?
    `;

    db.query(sql, [comboId], (err, result) => {

        if (err) {
            console.log("DELETE COMBO DATABASE ERROR:", err);

            return res.status(500).json({
                success: false,
                message: "Database Error"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Combo not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Combo deleted successfully"
        });
    });
};
exports.makeAllMenuUnavailable = (req, res) => {

    console.log("MAKE ALL MENU ITEMS UNAVAILABLE API RUNNING");

    const sql = `
        UPDATE menu
        SET available = 0
        WHERE id > 0
    `;

    db.query(sql, (err, result) => {

        if (err) {

            console.log("MAKE ALL UNAVAILABLE DATABASE ERROR:", err);

            return res.status(500).json({
                success: false,
                message: "Database Error"
            });

        }

        return res.status(200).json({

            success: true,

            message: "All Menu Items are now Unavailable",

            affectedRows: result.affectedRows

        });

    });

};