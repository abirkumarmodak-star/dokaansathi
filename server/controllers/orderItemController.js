const db = require("../config/db");


// ======================================================
// GET ALL ORDER ITEMS
// ======================================================

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
        ORDER BY oi.id DESC
    `;

    db.query(sql, (err, result) => {

        if (err) {

            console.log("GET ORDER ITEMS ERROR:", err);

            return res.status(500).json({
                success: false,
                message: "Failed To Load Order Items",
                error: err.sqlMessage || err.message
            });

        }

        res.status(200).json({
            success: true,
            orderItems: result
        });

    });

};


// ======================================================
// CREATE ORDER ITEM
// ======================================================
// Used by:
// POST /api/order-items
//
// This function now protects against negative stock.
// ======================================================

exports.createOrderItem = (req, res) => {

    const {
        order_id,
        menu_id,
        quantity,
        price
    } = req.body;


    // ==================================================
    // VALIDATION
    // ==================================================

    if (
        !order_id ||
        !menu_id ||
        !quantity ||
        price === undefined ||
        price === null
    ) {

        return res.status(400).json({
            success: false,
            message: "Required Data Missing"
        });

    }


    if (
        Number(quantity) <= 0 ||
        Number(price) < 0
    ) {

        return res.status(400).json({
            success: false,
            message: "Invalid Quantity Or Price"
        });

    }


    const orderQuantity = Number(quantity);
    const itemPrice = Number(price);
    const subtotal = orderQuantity * itemPrice;


    // ==================================================
    // STEP 1 : CHECK ORDER STATUS
    // ==================================================

    const checkOrderSQL = `
        SELECT order_status
        FROM orders
        WHERE id = ?
    `;

    db.query(
        checkOrderSQL,
        [order_id],
        (orderErr, orderResult) => {

            if (orderErr) {

                console.log("ORDER STATUS ERROR:", orderErr);

                return res.status(500).json({
                    success: false,
                    message: "Database Error"
                });

            }


            if (orderResult.length === 0) {

                return res.status(404).json({
                    success: false,
                    message: "Order Not Found"
                });

            }


            if (
                orderResult[0].order_status !== "Pending"
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Order cannot be modified after preparation started"
                });

            }


            // ==================================================
            // STEP 2 : ATOMIC STOCK DEDUCTION
            // ==================================================
            //
            // IMPORTANT:
            //
            // We do NOT first check stock and then deduct it.
            //
            // Instead:
            //
            // current_stock >= requested quantity
            //
            // AND
            //
            // current_stock = current_stock - quantity
            //
            // happen in ONE SQL UPDATE.
            //
            // This prevents negative stock.
            // ==================================================

            const deductStockSQL = `
                UPDATE inventory
                SET
                    current_stock = current_stock - ?
                WHERE menu_id = ?
                AND current_stock >= ?
            `;


            db.query(
                deductStockSQL,
                [
                    orderQuantity,
                    menu_id,
                    orderQuantity
                ],
                (stockErr, stockResult) => {

                    if (stockErr) {

                        console.log(
                            "STOCK DEDUCTION ERROR:",
                            stockErr
                        );

                        return res.status(500).json({
                            success: false,
                            message: "Inventory Update Failed"
                        });

                    }


                    // ==================================================
                    // STOCK NOT AVAILABLE
                    // ==================================================

                    if (
                        stockResult.affectedRows === 0
                    ) {

                        // Get actual current stock
                        const checkStockSQL = `
                            SELECT current_stock
                            FROM inventory
                            WHERE menu_id = ?
                        `;

                        db.query(
                            checkStockSQL,
                            [menu_id],
                            (checkErr, checkResult) => {

                                if (checkErr) {

                                    console.log(
                                        "STOCK CHECK ERROR:",
                                        checkErr
                                    );

                                    return res.status(500).json({
                                        success: false,
                                        message: "Inventory Error"
                                    });

                                }


                                if (
                                    checkResult.length === 0
                                ) {

                                    return res.status(404).json({
                                        success: false,
                                        message:
                                            "Inventory Not Found"
                                    });

                                }


                                const currentStock =
                                    Math.max(
                                        0,
                                        Number(
                                            checkResult[0]
                                                .current_stock || 0
                                        )
                                    );


                                // ==========================================
                                // ZERO STOCK
                                // ==========================================

                                if (
                                    currentStock <= 0
                                ) {

                                    return res.status(400).json({
                                        success: false,
                                        message:
                                            "No Stock Available",
                                        currentStock: 0
                                    });

                                }


                                // ==========================================
                                // PARTIAL STOCK
                                // ==========================================

                                return res.status(400).json({

                                    success: false,

                                    message:
                                        `Only ${currentStock} stock available`,

                                    currentStock:
                                        currentStock

                                });

                            }
                        );

                        return;

                    }


                    // ==================================================
                    // STEP 3 : INSERT ORDER ITEM
                    // ==================================================

                    const insertSQL = `
                        INSERT INTO order_items
                        (
                            order_id,
                            menu_id,
                            quantity,
                            price,
                            subtotal
                        )
                        VALUES (?, ?, ?, ?, ?)
                    `;


                    db.query(
                        insertSQL,
                        [
                            order_id,
                            menu_id,
                            orderQuantity,
                            itemPrice,
                            subtotal
                        ],
                        (insertErr, insertResult) => {

                            if (insertErr) {

                                console.log(
                                    "ORDER ITEM INSERT ERROR:",
                                    insertErr
                                );


                                // ==========================================
                                // IMPORTANT:
                                // If order_items INSERT fails,
                                // restore the stock that we already deducted.
                                // ==========================================

                                const restoreSQL = `
                                    UPDATE inventory
                                    SET
                                        current_stock =
                                            current_stock + ?
                                    WHERE menu_id = ?
                                `;


                                db.query(
                                    restoreSQL,
                                    [
                                        orderQuantity,
                                        menu_id
                                    ],
                                    (restoreErr) => {

                                        if (restoreErr) {

                                            console.log(
                                                "STOCK RESTORE ERROR:",
                                                restoreErr
                                            );

                                        }

                                        return res.status(500).json({

                                            success: false,

                                            message:
                                                "Item Add Failed",

                                            error:
                                                insertErr.sqlMessage ||
                                                insertErr.message

                                        });

                                    }
                                );

                                return;

                            }


                            // ==================================================
                            // STEP 4 : RECALCULATE ORDER TOTAL
                            // ==================================================

                            const totalSQL = `
                                SELECT
                                    SUM(subtotal) AS grandTotal
                                FROM order_items
                                WHERE order_id = ?
                            `;


                            db.query(
                                totalSQL,
                                [order_id],
                                (sumErr, totalResult) => {

                                    if (sumErr) {

                                        console.log(
                                            "TOTAL CALCULATION ERROR:",
                                            sumErr
                                        );

                                        return res.status(500).json({

                                            success: false,

                                            message:
                                                "Order Total Calculation Failed"

                                        });

                                    }


                                    const grandTotal =
                                        Number(
                                            totalResult[0]
                                                .grandTotal || 0
                                        );


                                    // ==================================================
                                    // STEP 5 : UPDATE ORDER TOTAL
                                    // ==================================================

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

                                                console.log(
                                                    "ORDER TOTAL UPDATE ERROR:",
                                                    orderErr
                                                );

                                                return res.status(500).json({

                                                    success: false,

                                                    message:
                                                        "Order Update Failed"

                                                });

                                            }


                                            return res.status(200).json({

                                                success: true,

                                                message:
                                                    "Order Item Created Successfully",

                                                orderItemId:
                                                    insertResult.insertId,

                                                quantitySold:
                                                    orderQuantity,

                                                subtotal:
                                                    subtotal,

                                                newTotal:
                                                    grandTotal

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

};


// ======================================================
// UPDATE ORDER ITEM
// ======================================================

exports.updateOrderItem = (req, res) => {

    const {
        order_item_id,
        menu_id,
        quantity,
        price
    } = req.body;


    // ==================================================
    // VALIDATION
    // ==================================================

    if (
        !order_item_id ||
        !menu_id ||
        !quantity ||
        price === undefined ||
        price === null
    ) {

        return res.status(400).json({
            success: false,
            message: "Required Data Missing"
        });

    }


    const newQuantity = Number(quantity);
    const newPrice = Number(price);


    if (
        newQuantity <= 0 ||
        newPrice < 0
    ) {

        return res.status(400).json({
            success: false,
            message: "Invalid Quantity Or Price"
        });

    }


    // ==================================================
    // STEP 1 : GET OLD ORDER ITEM
    // ==================================================

    const getOldSQL = `
        SELECT
            order_id,
            menu_id,
            quantity
        FROM order_items
        WHERE id = ?
    `;


    db.query(
        getOldSQL,
        [order_item_id],
        (err, oldResult) => {

            if (err) {

                console.log(
                    "GET OLD ORDER ITEM ERROR:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: "Database Error"
                });

            }


            if (
                oldResult.length === 0
            ) {

                return res.status(404).json({
                    success: false,
                    message: "Order Item Not Found"
                });

            }


            const oldMenuId =
                oldResult[0].menu_id;

            const oldQuantity =
                Number(oldResult[0].quantity);

            const orderId =
                oldResult[0].order_id;


            // ==================================================
            // STEP 2 : CHECK ORDER STATUS
            // ==================================================

            const statusSQL = `
                SELECT order_status
                FROM orders
                WHERE id = ?
            `;


            db.query(
                statusSQL,
                [orderId],
                (statusErr, statusResult) => {

                    if (statusErr) {

                        return res.status(500).json({
                            success: false,
                            message: "Database Error"
                        });

                    }


                    if (
                        statusResult.length === 0
                    ) {

                        return res.status(404).json({
                            success: false,
                            message: "Order Not Found"
                        });

                    }


                    if (
                        statusResult[0].order_status !==
                        "Pending"
                    ) {

                        return res.status(400).json({
                            success: false,
                            message:
                                "Order cannot be edited because preparation has already started."
                        });

                    }


                    // ==================================================
                    // STEP 3 :
                    // RESTORE OLD STOCK
                    // ==================================================

                    const restoreSQL = `
                        UPDATE inventory
                        SET
                            current_stock =
                                current_stock + ?
                        WHERE menu_id = ?
                    `;


                    db.query(
                        restoreSQL,
                        [
                            oldQuantity,
                            oldMenuId
                        ],
                        (restoreErr) => {

                            if (restoreErr) {

                                console.log(
                                    "RESTORE STOCK ERROR:",
                                    restoreErr
                                );

                                return res.status(500).json({
                                    success: false,
                                    message:
                                        "Inventory Restore Failed"
                                });

                            }


                            // ==================================================
                            // STEP 4 :
                            // ATOMIC DEDUCTION FOR NEW QUANTITY
                            // ==================================================

                            const deductSQL = `
                                UPDATE inventory
                                SET
                                    current_stock =
                                        current_stock - ?
                                WHERE menu_id = ?
                                AND current_stock >= ?
                            `;


                            db.query(
                                deductSQL,
                                [
                                    newQuantity,
                                    menu_id,
                                    newQuantity
                                ],
                                (deductErr, deductResult) => {

                                    if (deductErr) {

                                        console.log(
                                            "NEW STOCK DEDUCTION ERROR:",
                                            deductErr
                                        );

                                        // Restore old stock again
                                        const rollbackSQL = `
                                            UPDATE inventory
                                            SET
                                                current_stock =
                                                    current_stock - ?
                                            WHERE menu_id = ?
                                        `;

                                        db.query(
                                            rollbackSQL,
                                            [
                                                oldQuantity,
                                                oldMenuId
                                            ],
                                            () => {

                                                return res.status(500).json({
                                                    success: false,
                                                    message:
                                                        "Inventory Update Failed"
                                                });

                                            }
                                        );

                                        return;

                                    }


                                    // ==================================================
                                    // NEW STOCK NOT AVAILABLE
                                    // ==================================================

                                    if (
                                        deductResult.affectedRows === 0
                                    ) {

                                        // Undo restoration
                                        const undoRestoreSQL = `
                                            UPDATE inventory
                                            SET
                                                current_stock =
                                                    current_stock - ?
                                            WHERE menu_id = ?
                                        `;


                                        db.query(
                                            undoRestoreSQL,
                                            [
                                                oldQuantity,
                                                oldMenuId
                                            ],
                                            () => {

                                                const checkSQL = `
                                                    SELECT current_stock
                                                    FROM inventory
                                                    WHERE menu_id = ?
                                                `;


                                                db.query(
                                                    checkSQL,
                                                    [menu_id],
                                                    (checkErr, checkResult) => {

                                                        if (checkErr) {

                                                            return res.status(500).json({
                                                                success: false,
                                                                message:
                                                                    "Inventory Error"
                                                            });

                                                        }


                                                        if (
                                                            checkResult.length === 0
                                                        ) {

                                                            return res.status(404).json({
                                                                success: false,
                                                                message:
                                                                    "Inventory Not Found"
                                                            });

                                                        }


                                                        const available =
                                                            Math.max(
                                                                0,
                                                                Number(
                                                                    checkResult[0]
                                                                        .current_stock ||
                                                                    0
                                                                )
                                                            );


                                                        if (
                                                            available <= 0
                                                        ) {

                                                            return res.status(400).json({
                                                                success: false,
                                                                message:
                                                                    "No Stock Available",
                                                                currentStock:
                                                                    0
                                                            });

                                                        }


                                                        return res.status(400).json({
                                                            success: false,
                                                            message:
                                                                `Only ${available} stock available`,
                                                            currentStock:
                                                                available
                                                        });

                                                    }
                                                );

                                            }
                                        );

                                        return;

                                    }


                                    // ==================================================
                                    // STEP 5 : UPDATE ORDER ITEM
                                    // ==================================================

                                    const subtotal =
                                        newQuantity * newPrice;


                                    const updateSQL = `
                                        UPDATE order_items
                                        SET
                                            menu_id = ?,
                                            quantity = ?,
                                            price = ?,
                                            subtotal = ?
                                        WHERE id = ?
                                    `;


                                    db.query(
                                        updateSQL,
                                        [
                                            menu_id,
                                            newQuantity,
                                            newPrice,
                                            subtotal,
                                            order_item_id
                                        ],
                                        (updateErr) => {

                                            if (updateErr) {

                                                console.log(
                                                    "ORDER ITEM UPDATE ERROR:",
                                                    updateErr
                                                );

                                                // Restore new stock
                                                const restoreNewSQL = `
                                                    UPDATE inventory
                                                    SET
                                                        current_stock =
                                                            current_stock + ?
                                                    WHERE menu_id = ?
                                                `;

                                                db.query(
                                                    restoreNewSQL,
                                                    [
                                                        newQuantity,
                                                        menu_id
                                                    ],
                                                    () => {

                                                        return res.status(500).json({
                                                            success: false,
                                                            message:
                                                                "Order Item Update Failed"
                                                        });

                                                    }
                                                );

                                                return;

                                            }


                                            // ==================================================
                                            // STEP 6 : RECALCULATE TOTAL
                                            // ==================================================

                                            const totalSQL = `
                                                SELECT
                                                    SUM(subtotal) AS grandTotal
                                                FROM order_items
                                                WHERE order_id = ?
                                            `;


                                            db.query(
                                                totalSQL,
                                                [orderId],
                                                (sumErr, totalResult) => {

                                                    if (sumErr) {

                                                        return res.status(500).json({
                                                            success: false,
                                                            message:
                                                                "Database Error"
                                                        });

                                                    }


                                                    const grandTotal =
                                                        Number(
                                                            totalResult[0]
                                                                .grandTotal || 0
                                                        );


                                                    const updateOrderSQL = `
                                                        UPDATE orders
                                                        SET total_amount = ?
                                                        WHERE id = ?
                                                    `;


                                                    db.query(
                                                        updateOrderSQL,
                                                        [
                                                            grandTotal,
                                                            orderId
                                                        ],
                                                        (orderErr) => {

                                                            if (orderErr) {

                                                                return res.status(500).json({
                                                                    success: false,
                                                                    message:
                                                                        "Order Total Update Failed"
                                                                });

                                                            }


                                                            return res.status(200).json({

                                                                success: true,

                                                                message:
                                                                    "Order Updated Successfully",

                                                                newTotal:
                                                                    grandTotal

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

                }
            );

        }
    );

};


// ======================================================
// ADD ORDER ITEM
// ======================================================
// Used by:
// POST /api/order-items/add
//
// THIS IS THE MOST IMPORTANT FUNCTION FOR YOUR CURRENT
// "MASALA DOSA -1" PROBLEM.
// ======================================================

exports.addOrderItem = (req, res) => {

    const {
        order_id,
        menu_id,
        quantity,
        price
    } = req.body;


    // ==================================================
    // VALIDATION
    // ==================================================

    if (
        !order_id ||
        !menu_id ||
        !quantity ||
        price === undefined ||
        price === null
    ) {

        return res.status(400).json({
            success: false,
            message: "Required Data Missing"
        });

    }


    const requestedQuantity =
        Number(quantity);

    const itemPrice =
        Number(price);


    if (
        requestedQuantity <= 0 ||
        itemPrice < 0
    ) {

        return res.status(400).json({
            success: false,
            message: "Invalid Quantity Or Price"
        });

    }


    // ==================================================
    // STEP 1 : CHECK ORDER STATUS
    // ==================================================

    const checkOrderSQL = `
        SELECT order_status
        FROM orders
        WHERE id = ?
    `;


    db.query(
        checkOrderSQL,
        [order_id],
        (err, orderResult) => {

            if (err) {

                console.log(
                    "CHECK ORDER ERROR:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: "Database Error"
                });

            }


            if (
                orderResult.length === 0
            ) {

                return res.status(404).json({
                    success: false,
                    message: "Order Not Found"
                });

            }


            if (
                orderResult[0].order_status !==
                "Pending"
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Order cannot be modified after preparation started"
                });

            }


            // ==================================================
            // STEP 2 : ATOMIC STOCK CHECK + DEDUCTION
            // ==================================================

            const deductStockSQL = `
                UPDATE inventory
                SET
                    current_stock =
                        current_stock - ?
                WHERE menu_id = ?
                AND current_stock >= ?
            `;


            db.query(
                deductStockSQL,
                [
                    requestedQuantity,
                    menu_id,
                    requestedQuantity
                ],
                (stockErr, stockResult) => {

                    if (stockErr) {

                        console.log(
                            "ADD ITEM STOCK ERROR:",
                            stockErr
                        );

                        return res.status(500).json({
                            success: false,
                            message:
                                "Inventory Update Failed"
                        });

                    }


                    // ==================================================
                    // STOCK WAS NOT AVAILABLE
                    // ==================================================

                    if (
                        stockResult.affectedRows === 0
                    ) {

                        const checkStockSQL = `
                            SELECT current_stock
                            FROM inventory
                            WHERE menu_id = ?
                        `;


                        db.query(
                            checkStockSQL,
                            [menu_id],
                            (checkErr, stockResult2) => {

                                if (checkErr) {

                                    return res.status(500).json({
                                        success: false,
                                        message:
                                            "Inventory Error"
                                    });

                                }


                                if (
                                    stockResult2.length === 0
                                ) {

                                    return res.status(404).json({
                                        success: false,
                                        message:
                                            "Inventory Not Found"
                                    });

                                }


                                const availableStock =
                                    Math.max(
                                        0,
                                        Number(
                                            stockResult2[0]
                                                .current_stock || 0
                                        )
                                    );


                                if (
                                    availableStock <= 0
                                ) {

                                    return res.status(400).json({

                                        success: false,

                                        message:
                                            "No Stock Available",

                                        currentStock:
                                            0

                                    });

                                }


                                return res.status(400).json({

                                    success: false,

                                    message:
                                        `Only ${availableStock} stock available`,

                                    currentStock:
                                        availableStock

                                });

                            }
                        );

                        return;

                    }


                    // ==================================================
                    // STEP 3 : INSERT ORDER ITEM
                    // ==================================================

                    const subtotal =
                        requestedQuantity *
                        itemPrice;


                    const insertSQL = `
                        INSERT INTO order_items
                        (
                            order_id,
                            menu_id,
                            quantity,
                            price,
                            subtotal
                        )
                        VALUES (?, ?, ?, ?, ?)
                    `;


                    db.query(
                        insertSQL,
                        [
                            order_id,
                            menu_id,
                            requestedQuantity,
                            itemPrice,
                            subtotal
                        ],
                        (insertErr, insertResult) => {

                            if (insertErr) {

                                console.log(
                                    "ADD ITEM INSERT ERROR:",
                                    insertErr
                                );


                                // ==================================================
                                // RESTORE STOCK IF INSERT FAILED
                                // ==================================================

                                const restoreSQL = `
                                    UPDATE inventory
                                    SET
                                        current_stock =
                                            current_stock + ?
                                    WHERE menu_id = ?
                                `;


                                db.query(
                                    restoreSQL,
                                    [
                                        requestedQuantity,
                                        menu_id
                                    ],
                                    (restoreErr) => {

                                        if (restoreErr) {

                                            console.log(
                                                "RESTORE STOCK ERROR:",
                                                restoreErr
                                            );

                                        }


                                        return res.status(500).json({

                                            success: false,

                                            message:
                                                "Item Add Failed",

                                            error:
                                                insertErr.sqlMessage ||
                                                insertErr.message

                                        });

                                    }
                                );

                                return;

                            }


                            // ==================================================
                            // STEP 4 : RECALCULATE ORDER TOTAL
                            // ==================================================

                            const totalSQL = `
                                SELECT
                                    SUM(subtotal) AS grandTotal
                                FROM order_items
                                WHERE order_id = ?
                            `;


                            db.query(
                                totalSQL,
                                [order_id],
                                (sumErr, totalResult) => {

                                    if (sumErr) {

                                        return res.status(500).json({

                                            success: false,

                                            message:
                                                "Database Error"

                                        });

                                    }


                                    const grandTotal =
                                        Number(
                                            totalResult[0]
                                                .grandTotal || 0
                                        );


                                    // ==================================================
                                    // STEP 5 : UPDATE ORDER TOTAL
                                    // ==================================================

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

                                                    success: false,

                                                    message:
                                                        "Order Update Failed"

                                                });

                                            }


                                            return res.status(200).json({

                                                success: true,

                                                message:
                                                    "Item Added Successfully",

                                                orderItemId:
                                                    insertResult.insertId,

                                                newTotal:
                                                    grandTotal

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

};