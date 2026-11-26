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

        if (!results || results.length === 0) {
            return res.status(200).json([]);
        }

        const menuIds = results.map(item => item.id);

        const ingredientSql = `
            SELECT
                id,
                menu_id,
                ingredient_name,
                half_quantity,
                full_quantity,
                unit,
                sort_order
            FROM menu_ingredients
            WHERE menu_id IN (?)
            ORDER BY sort_order ASC, id ASC
        `;

        db.query(ingredientSql, [menuIds], (ingredientErr, ingredients) => {
            if (ingredientErr) {
                console.log("INGREDIENT DATABASE ERROR:", ingredientErr);

                return res.status(500).json({
                    success: false,
                    message: "Failed to load menu ingredients"
                });
            }

            const ingredientMap = {};

            ingredients.forEach(ingredient => {
                if (!ingredientMap[ingredient.menu_id]) {
                    ingredientMap[ingredient.menu_id] = [];
                }

                ingredientMap[ingredient.menu_id].push({
                    id: ingredient.id,
                    ingredient_name: ingredient.ingredient_name,
                    half_quantity: ingredient.half_quantity,
                    full_quantity: ingredient.full_quantity,
                    unit: ingredient.unit,
                    sort_order: ingredient.sort_order
                });
            });

            const formattedResults = results.map(item => ({
                ...item,
                ingredients: ingredientMap[item.id] || []
            }));

            console.log("MENU + INVENTORY + INGREDIENTS:", formattedResults);

            return res.status(200).json(formattedResults);
        });
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
        serving_size,
        ingredients
    } = req.body;

    if (
        !name ||
        !category ||
        full_price === undefined ||
        full_price === null ||
        !Number.isFinite(Number(full_price)) ||
        Number(full_price) < 0
    ) {
        return res.status(400).json({
            success: false,
            message: "Valid Name, Category and Full Price are required"
        });
    }

    // Validate ingredients
    const validIngredients = [];

    if (ingredients !== undefined && !Array.isArray(ingredients)) {
        return res.status(400).json({
            success: false,
            message: "Ingredients must be an array"
        });
    }

    for (const [index, item] of (ingredients || []).entries()) {
        if (
            !item ||
            typeof item.ingredient_name !== "string" ||
            !item.ingredient_name.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: `Ingredient name is required at row ${index + 1}`
            });
        }

        const halfQty =
            item.half_quantity === "" ||
            item.half_quantity === null ||
            item.half_quantity === undefined
                ? null
                : Number(item.half_quantity);

        const fullQty =
            item.full_quantity === "" ||
            item.full_quantity === null ||
            item.full_quantity === undefined
                ? null
                : Number(item.full_quantity);

        if (
            (halfQty !== null &&
                (!Number.isFinite(halfQty) || halfQty < 0)) ||
            (fullQty !== null &&
                (!Number.isFinite(fullQty) || fullQty < 0))
        ) {
            return res.status(400).json({
                success: false,
                message: `Invalid ingredient quantity at row ${index + 1}`
            });
        }

        validIngredients.push([
            item.ingredient_name.trim(),
            halfQty,
            fullQty,
            typeof item.unit === "string"
                ? item.unit.trim() || null
                : null,
            index
        ]);
    }

    db.getConnection((connectionErr, conn) => {
        if (connectionErr) {
            console.log("DATABASE CONNECTION ERROR:", connectionErr);

            return res.status(500).json({
                success: false,
                message: "Database Connection Failed"
            });
        }

        conn.beginTransaction(transactionErr => {
            if (transactionErr) {
                conn.release();

                return res.status(500).json({
                    success: false,
                    message: "Could not start database transaction"
                });
            }

            const rollbackError = (message, error) => {
                if (error) {
                    console.log(message, error);
                }

                return conn.rollback(() => {
                    conn.release();

                    return res.status(500).json({
                        success: false,
                        message
                    });
                });
            };

            // 1. Insert Menu Item
            const menuSql = `
                INSERT INTO menu
                (
                    name,
                    category,
                    price,
                    half_price,
                    full_price,
                    available,
                    serving_type,
                    serving_size
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;

            conn.query(
                menuSql,
                [
                    name,
                    category,
                    Number(full_price),
                    half_price,
                    full_price,
                    available,
                    serving_type,
                    serving_size
                ],
                (menuErr, menuResult) => {
                    if (menuErr) {
                        return rollbackError(
                            "CREATE MENU ERROR:",
                            menuErr
                        );
                    }

                    const menuId = menuResult.insertId;

                    // 2. Insert Inventory Record
                    const inventorySql = `
                        INSERT INTO inventory
                        (
                            menu_id,
                            opening_stock,
                            current_stock,
                            stock_quantity,
                            reorder_level,
                            online_sold,
                            offline_sold,
                            last_updated
                        )
                        VALUES (?, 0, 0, 0, 0, 0, 0, NOW())
                    `;

                    conn.query(
                        inventorySql,
                        [menuId],
                        inventoryErr => {
                            if (inventoryErr) {
                                return rollbackError(
                                    "CREATE INVENTORY ERROR:",
                                    inventoryErr
                                );
                            }

                            // 3. Insert Ingredients (if provided)
                            if (validIngredients.length === 0) {
                                return conn.commit(commitErr => {
                                    if (commitErr) {
                                        return rollbackError(
                                            "FAILED TO SAVE MENU AND INVENTORY:",
                                            commitErr
                                        );
                                    }

                                    conn.release();

                                    return res.status(201).json({
                                        success: true,
                                        message:
                                            "Menu Item and Inventory Added Successfully",
                                        menuId
                                    });
                                });
                            }

                            const ingredientValues =
                                validIngredients.map(item => [
                                    menuId,
                                    item[0],
                                    item[1],
                                    item[2],
                                    item[3],
                                    item[4]
                                ]);

                            const ingredientSql = `
                                INSERT INTO menu_ingredients
                                (
                                    menu_id,
                                    ingredient_name,
                                    half_quantity,
                                    full_quantity,
                                    unit,
                                    sort_order
                                )
                                VALUES ?
                            `;

                            conn.query(
                                ingredientSql,
                                [ingredientValues],
                                ingredientErr => {
                                    if (ingredientErr) {
                                        return rollbackError(
                                            "SAVE INGREDIENT ERROR:",
                                            ingredientErr
                                        );
                                    }

                                    // 4. Commit all changes
                                    conn.commit(commitErr => {
                                        if (commitErr) {
                                            return rollbackError(
                                                "FAILED TO SAVE MENU, INVENTORY AND INGREDIENTS:",
                                                commitErr
                                            );
                                        }

                                        conn.release();

                                        return res.status(201).json({
                                            success: true,
                                            message:
                                                "Menu Item, Inventory and Ingredients Added Successfully",
                                            menuId
                                        });
                                    });
                                }
                            );
                        }
                    );
                }
            );
        });
    });
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
        serving_size,
        ingredients
    } = req.body;

    if (
        !name ||
        !category ||
        full_price === undefined ||
        full_price === null ||
        !Number.isFinite(Number(full_price)) ||
        Number(full_price) < 0
    ) {
        return res.status(400).json({
            success: false,
            message: "Valid Name, Category and Full Price are required"
        });
    }

    if (ingredients !== undefined && !Array.isArray(ingredients)) {
        return res.status(400).json({
            success: false,
            message: "Ingredients must be an array"
        });
    }

    const validIngredients = [];

    for (const [index, item] of (ingredients || []).entries()) {
        if (
            !item ||
            typeof item.ingredient_name !== "string" ||
            !item.ingredient_name.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: `Ingredient name is required at row ${index + 1}`
            });
        }

        const halfQty =
            item.half_quantity === "" ||
            item.half_quantity === null ||
            item.half_quantity === undefined
                ? null
                : Number(item.half_quantity);

        const fullQty =
            item.full_quantity === "" ||
            item.full_quantity === null ||
            item.full_quantity === undefined
                ? null
                : Number(item.full_quantity);

        if (
            (halfQty !== null && (!Number.isFinite(halfQty) || halfQty < 0)) ||
            (fullQty !== null && (!Number.isFinite(fullQty) || fullQty < 0))
        ) {
            return res.status(400).json({
                success: false,
                message: `Invalid ingredient quantity at row ${index + 1}`
            });
        }

        validIngredients.push([
            item.ingredient_name.trim(),
            halfQty,
            fullQty,
            typeof item.unit === "string"
                ? item.unit.trim() || null
                : null,
            index
        ]);
    }

    db.getConnection((connectionErr, conn) => {
        if (connectionErr) {
            console.log("DATABASE CONNECTION ERROR:", connectionErr);

            return res.status(500).json({
                success: false,
                message: "Database Connection Failed"
            });
        }

        conn.beginTransaction(transactionErr => {
            if (transactionErr) {
                conn.release();

                return res.status(500).json({
                    success: false,
                    message: "Could not start database transaction"
                });
            }

            const rollbackError = (message, error) => {
                if (error) {
                    console.log(message, error);
                }

                return conn.rollback(() => {
                    conn.release();

                    return res.status(500).json({
                        success: false,
                        message
                    });
                });
            };

            conn.query(
                "SELECT id FROM menu WHERE id = ? FOR UPDATE",
                [id],
                (checkErr, existingMenu) => {
                    if (checkErr) {
                        return rollbackError(
                            "Failed to check menu item",
                            checkErr
                        );
                    }

                    if (!existingMenu.length) {
                        return conn.rollback(() => {
                            conn.release();

                            return res.status(404).json({
                                success: false,
                                message: "Food Not Found"
                            });
                        });
                    }

                    const updateSql = `
                        UPDATE menu
                        SET
                            name = ?,
                            category = ?,
                            price = ?,
                            half_price = ?,
                            full_price = ?,
                            available = ?,
                            serving_type = ?,
                            serving_size = ?
                        WHERE id = ?
                    `;

                    conn.query(
                        updateSql,
                        [
                            name,
                            category,
                            Number(full_price),
                            half_price,
                            full_price,
                            available,
                            serving_type,
                            serving_size,
                            id
                        ],
                        updateErr => {
                            if (updateErr) {
                                return rollbackError(
                                    "Failed to update menu item",
                                    updateErr
                                );
                            }

                            if (ingredients === undefined) {
                                return conn.commit(commitErr => {
                                    if (commitErr) {
                                        return rollbackError(
                                            "Failed to save menu update",
                                            commitErr
                                        );
                                    }

                                    conn.release();

                                    return res.status(200).json({
                                        success: true,
                                        message: "Menu Item Updated Successfully"
                                    });
                                });
                            }

                            conn.query(
                                "DELETE FROM menu_ingredients WHERE menu_id = ?",
                                [id],
                                deleteErr => {
                                    if (deleteErr) {
                                        return rollbackError(
                                            "Failed to replace old ingredients",
                                            deleteErr
                                        );
                                    }

                                    if (validIngredients.length === 0) {
                                        return conn.commit(commitErr => {
                                            if (commitErr) {
                                                return rollbackError(
                                                    "Failed to save menu update",
                                                    commitErr
                                                );
                                            }

                                            conn.release();

                                            return res.status(200).json({
                                                success: true,
                                                message: "Menu Item and Ingredients Updated Successfully"
                                            });
                                        });
                                    }

                                    const ingredientValues =
                                        validIngredients.map(item => [
                                            Number(id),
                                            item[0],
                                            item[1],
                                            item[2],
                                            item[3],
                                            item[4]
                                        ]);

                                    const ingredientSql = `
                                        INSERT INTO menu_ingredients
                                        (
                                            menu_id,
                                            ingredient_name,
                                            half_quantity,
                                            full_quantity,
                                            unit,
                                            sort_order
                                        )
                                        VALUES ?
                                    `;

                                    conn.query(
                                        ingredientSql,
                                        [ingredientValues],
                                        ingredientErr => {
                                            if (ingredientErr) {
                                                return rollbackError(
                                                    "Failed to save updated ingredients",
                                                    ingredientErr
                                                );
                                            }

                                            conn.commit(commitErr => {
                                                if (commitErr) {
                                                    return rollbackError(
                                                        "Failed to commit menu update",
                                                        commitErr
                                                    );
                                                }

                                                conn.release();

                                                return res.status(200).json({
                                                    success: true,
                                                    message: "Menu Item and Ingredients Updated Successfully"
                                                });
                                            });
                                        }
                                    );
                                }
                            );
                        }
                    );
                }
            );
        });
    });
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