const db = require("../config/db");


// ==============================
// GET ALL ORDER ITEMS
// ==============================

exports.getOrderItems = (req, res) => {

    const sql = `
        SELECT
            oi.id,
            oi.order_id,
            oi.menu_id,
            m.name AS menu_name,
            oi.quantity,
            oi.price,
            oi.subtotal
        FROM order_items oi
        JOIN menu m
        ON oi.menu_id = m.id
    `;

    db.query(sql, (err, result) => {

        if (err) {
            return res.status(500).json({
                error: err
            });
        }

        res.json(result);

    });

};


// ==============================
// CREATE ORDER ITEM
// ==============================

exports.createOrderItem = (req, res) => {

    const { order_id, menu_id, quantity, price } = req.body;

    const subtotal = quantity * price;

    // Insert Order Item
    const insertSql = `
        INSERT INTO order_items
        (order_id, menu_id, quantity, price, subtotal)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
        insertSql,
        [order_id, menu_id, quantity, price, subtotal],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    error: err
                });
            }

            // Update Current Stock
            const updateStockSql = `
                UPDATE inventory
                SET current_stock = current_stock - ?
                WHERE menu_id = ?
            `;

            db.query(
                updateStockSql,
                [quantity, menu_id],
                (stockErr, stockResult) => {

                    if (stockErr) {
                        return res.status(500).json({
                            error: stockErr
                        });
                    }

                    res.json({
                        message: "Order Item Created & Current Stock Updated Successfully",
                        orderItemId: result.insertId,
                        quantitySold: quantity,
                        subtotal: subtotal
                    });

                }
            );

        }
    );

};
// ==============================
// UPDATE ORDER ITEM
// ==============================

// ==============================
// UPDATE ORDER ITEM
// ==============================

exports.updateOrderItem = (req, res) => {

    const {
        order_item_id,
        menu_id,
        quantity,
        price
    } = req.body;

    const getOldSql = `
        SELECT order_id, menu_id, quantity
        FROM order_items
        WHERE id = ?
    `;

    db.query(getOldSql, [order_item_id], (err, oldResult) => {

        if (err) {
            return res.status(500).json({
                message: "Database Error"
            });
        }

        if (oldResult.length === 0) {
            return res.status(404).json({
                message: "Order Item Not Found"
            });
        }

        const oldMenuId = oldResult[0].menu_id;
        const oldQuantity = oldResult[0].quantity;
        const orderId = oldResult[0].order_id;

        // Check Order Status
        const statusSql = `
            SELECT order_status
            FROM orders
            WHERE id = ?
        `;

        db.query(statusSql, [orderId], (statusErr, statusResult) => {

            if (statusErr) {
                return res.status(500).json({
                    message: "Database Error"
                });
            }

            if (statusResult.length === 0) {
                return res.status(404).json({
                    message: "Order Not Found"
                });
            }

            if (statusResult[0].order_status !== "Pending") {
                return res.status(400).json({
                    message: "Order cannot be edited because preparation has already started."
                });
            }

            // Restore Old Stock
            const restoreSql = `
                UPDATE inventory
                SET current_stock = current_stock + ?
                WHERE menu_id = ?
            `;

            db.query(
                restoreSql,
                [oldQuantity, oldMenuId],
                (restoreErr) => {

                    if (restoreErr) {
                        return res.status(500).json({
                            message: "Inventory Restore Failed"
                        });
                    }

                    // Deduct New Stock
                    const deductSql = `
                        UPDATE inventory
                        SET current_stock = current_stock - ?
                        WHERE menu_id = ?
                    `;

                    db.query(
                        deductSql,
                        [quantity, menu_id],
                        (deductErr) => {

                            if (deductErr) {
                                return res.status(500).json({
                                    message: "Inventory Update Failed"
                                });
                            }

                            const subtotal = quantity * price;

                            // Update Order Item
                            const updateSql = `
                                UPDATE order_items
                                SET
                                    menu_id = ?,
                                    quantity = ?,
                                    price = ?,
                                    subtotal = ?
                                WHERE id = ?
                            `;

                            db.query(
                                updateSql,
                                [
                                    menu_id,
                                    quantity,
                                    price,
                                    subtotal,
                                    order_item_id
                                ],
                                (updateErr) => {

                                    if (updateErr) {
                                        return res.status(500).json({
                                            message: "Database Error"
                                        });
                                    }

                                    // Bill Recalculation
                                    const totalSql = `
                                        SELECT SUM(subtotal) AS grandTotal
                                        FROM order_items
                                        WHERE order_id = ?
                                    `;

                                    db.query(
                                        totalSql,
                                        [orderId],
                                        (sumErr, totalResult) => {

                                            if (sumErr) {
                                                return res.status(500).json({
                                                    message: "Database Error"
                                                });
                                            }

                                            const grandTotal =
                                                totalResult[0].grandTotal || 0;

                                            const updateOrderSql = `
                                                UPDATE orders
                                                SET total_amount = ?
                                                WHERE id = ?
                                            `;

                                            db.query(
                                                updateOrderSql,
                                                [grandTotal, orderId],
                                                (orderErr) => {

                                                    if (orderErr) {
                                                        return res.status(500).json({
                                                            message: "Database Error"
                                                        });
                                                    }

                                                    res.json({
                                                        success: true,
                                                        message: "Order Updated Successfully",
                                                        newTotal: grandTotal
                                                    });

                                                }
                                            );

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
exports.addOrderItem = (req, res) => {

    const {
        order_id,
        menu_id,
        quantity,
        price
    } = req.body;

    if (!order_id || !menu_id || !quantity || !price) {

        return res.status(400).json({
            message: "Required Data Missing"
        });

    }

    // =====================================
    // STEP 1 : CHECK ORDER STATUS
    // =====================================

    const checkOrderSQL = `
        SELECT order_status
        FROM orders
        WHERE id = ?
    `;

    db.query(checkOrderSQL, [order_id], (err, orderResult) => {

        if (err) {

            return res.status(500).json({
                message: "Database Error"
            });

        }

        if (orderResult.length === 0) {

            return res.status(404).json({
                message: "Order Not Found"
            });

        }

        if (orderResult[0].order_status !== "Pending") {

            return res.status(400).json({
                message: "Order cannot be modified after preparation started"
            });

        }

        // =====================================
        // STEP 2 : CHECK INVENTORY
        // =====================================

        const stockSQL = `
            SELECT current_stock
            FROM inventory
            WHERE menu_id = ?
        `;

        db.query(stockSQL, [menu_id], (stockErr, stockResult) => {

            if (stockErr) {

                return res.status(500).json({
                    message: "Inventory Error"
                });

            }

            if (stockResult.length === 0) {

                return res.status(404).json({
                    message: "Inventory Not Found"
                });

            }

            if (stockResult[0].current_stock < quantity) {

                return res.status(400).json({
                    message: "Insufficient Stock"
                });

            }

            // =====================================
            // STEP 3 : INSERT ORDER ITEM
            // =====================================

            const subtotal = quantity * price;

            const insertSQL = `
                INSERT INTO order_items
                (
                    order_id,
                    menu_id,
                    quantity,
                    price,
                    subtotal
                )
                VALUES (?,?,?,?,?)
            `;

            db.query(
                insertSQL,
                [
                    order_id,
                    menu_id,
                    quantity,
                    price,
                    subtotal
                ],
                (insertErr) => {

                    if (insertErr) {

                        return res.status(500).json({
                            message: "Item Add Failed"
                        });

                    }

                    // =====================================
                    // STEP 4 : UPDATE INVENTORY
                    // =====================================

                    const updateStockSQL = `
                        UPDATE inventory
                        SET current_stock = current_stock - ?
                        WHERE menu_id = ?
                    `;

                    db.query(
                        updateStockSQL,
                        [
                            quantity,
                            menu_id
                        ],
                        (updateErr) => {

                            if (updateErr) {

                                return res.status(500).json({
                                    message: "Inventory Update Failed"
                                });

                            }

                            // =====================================
                            // STEP 5 : RECALCULATE ORDER TOTAL
                            // =====================================

                            const totalSQL = `
                                SELECT SUM(subtotal) AS grandTotal
                                FROM order_items
                                WHERE order_id = ?
                            `;

                            db.query(
                                totalSQL,
                                [order_id],
                                (sumErr, totalResult) => {

                                    if (sumErr) {

                                        return res.status(500).json({
                                            message: "Database Error"
                                        });

                                    }

                                    const grandTotal =
                                        totalResult[0].grandTotal || 0;

                                    const updateOrderSQL = `
                                        UPDATE orders
                                        SET total_amount = ?
                                        WHERE id = ?
                                    `;

                                    db.query(
                                        updateOrderSQL,
                                        [
                                            grandTotal,
                                            order_id
                                        ],
                                        (orderErr) => {

                                            if (orderErr) {

                                                return res.status(500).json({
                                                    message: "Order Update Failed"
                                                });

                                            }

                                            res.status(200).json({

                                                success: true,
                                                message: "Item Added Successfully",
                                                newTotal: grandTotal

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