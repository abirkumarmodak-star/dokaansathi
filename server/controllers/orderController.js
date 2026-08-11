const db = require("../config/db");

// ======================================
// TOKEN GENERATOR
// ======================================

function generateToken(callback) {

    const today = new Date();

    const date =
        today.getFullYear().toString().slice(2) +
        String(today.getMonth() + 1).padStart(2, "0") +
        String(today.getDate()).padStart(2, "0");

    const sql = `
        SELECT token_number
        FROM orders
        WHERE DATE(created_at) = CURDATE()
        ORDER BY id DESC
        LIMIT 1
    `;

    db.query(sql, (err, result) => {

        if (err) {

            return callback(err, null);

        }

        let nextNumber = 1;

        if (result.length > 0) {

            const lastToken = result[0].token_number;

            const lastNumber = parseInt(

                lastToken.substring(7)

            );

            nextNumber = lastNumber + 1;

        }

        const token =

            "T" +

            date +

            String(nextNumber).padStart(3, "0");

        callback(null, token);

    });

}

// ======================================
// GET ALL ORDERS
// ======================================

exports.getOrders = (req, res) => {

    const sql = `

        SELECT

            orders.*,

            customers.name AS customer_name,

            customers.phone

        FROM orders

        LEFT JOIN customers

        ON orders.customer_id = customers.id

        ORDER BY orders.id DESC

    `;
db.query(sql, async (err, result) => {

    if (err) {

        console.log(err);

        return res.status(500).json({

            message: "Database Error"

        });

    }

    try {

        const orders = await Promise.all(

            result.map(async (order) => {

                return new Promise((resolve, reject) => {

                    const itemSQL = `

                        SELECT

                            order_items.menu_id,

                            order_items.quantity,

                            menu.name

                        FROM order_items

                        LEFT JOIN menu

                        ON order_items.menu_id = menu.id

                        WHERE order_items.order_id = ?

                    `;

                    db.query(

                        itemSQL,

                        [order.id],

                        (itemErr, items) => {

                            if (itemErr) {

                                return reject(itemErr);

                            }

                            resolve({

                                ...order,

                                items

                            });

                        }

                    );

                });

            })

        );

        res.status(200).json({

            success: true,

            orders

        });

    }

    catch (error) {

        console.log(error);

        return res.status(500).json({

            success: false,

            message: "Failed To Load Order Items"

        });

    }

});
    
};
// ======================================
// CREATE ORDER WITH TOKEN SYSTEM
// ======================================

exports.createOrder = (req, res) => {

    console.log("========== CREATE ORDER ==========");
    console.log(req.body);
   const {

    customer_id,

    table_number,

    order_type,

    payment_method,

    items,

    total_amount

} = req.body;

    if (

        !customer_id ||

        !items ||

        items.length === 0

    ) {

        return res.status(400).json({

            success: false,

            message: "Customer and Items Required"

        });

    }

    generateToken((tokenError, token) => {

        if (tokenError) {

            console.log(tokenError);

            return res.status(500).json({

                success: false,

                message: "Token Generation Failed"

            });

        }

        const orderSQL = `

INSERT INTO orders
(

customer_id,

table_number,

order_type,

payment_method,

token_number,

total_amount,

order_status,

payment_status

)

VALUES
(
?,
?,
?,
?,
?,
?,
?,
?
)

`;

        db.query(

            orderSQL,
[

customer_id,

table_number,

order_type,

payment_method,

token,

total_amount,

"Pending",

"Pending"

],

            (err, orderResult) => {

             if (err) {

    console.log("========== ORDER INSERT ERROR ==========");
    console.log("MYSQL ERROR:", err);
    console.log("SQL MESSAGE:", err.sqlMessage);
    console.log("SQL CODE:", err.code);

    return res.status(500).json({

        success: false,

        message: "Order Creation Failed",

        error: err.sqlMessage,

        code: err.code

    });

}

                const order_id = orderResult.insertId;

                const itemValues = items.map(item => [

                    order_id,

                    item.menu_id,

                    item.quantity,

                    item.price,

                    item.quantity * item.price

                ]);

                const itemSQL = `

                    INSERT INTO order_items

                    (

                        order_id,

                        menu_id,

                        quantity,

                        price,

                        subtotal

                    )

                    VALUES ?

                `;

                db.query(

                    itemSQL,

                    [itemValues],

                    (itemErr) => {

                        if (itemErr) {

                            console.log(itemErr);

                            return res.status(500).json({

                                success: false,

                                message: "Order Items Failed",

                                error: itemErr.sqlMessage

                            });

                        }

                        return res.status(201).json({

                            success: true,

                            message: "Order Created Successfully",

                            order_id,

                            token,

                            status: "Pending"

                        });

                    }

                );

            }

        );

    });

};
// ======================================
// GET PENDING ORDERS
// ======================================

exports.getPendingOrders = (req, res) => {

    const sql = `

        SELECT

            orders.*,

            customers.name AS customer_name,

            customers.phone

        FROM orders

        LEFT JOIN customers

        ON orders.customer_id = customers.id

        WHERE orders.order_status = 'Pending'

        ORDER BY orders.id ASC

    `;

    db.query(sql, (err, result) => {

        if (err) {

            console.log(err);

            return res.status(500).json({

                success: false,

                message: "Database Error"

            });

        }

        res.status(200).json({

            success: true,

            pendingOrders: result

        });

    });

};


// ======================================
// ACCEPT SINGLE ORDER
// ======================================

exports.acceptOrder = (req, res) => {

    const { order_id } = req.body;

    if (!order_id) {

        return res.status(400).json({

            success: false,

            message: "Order ID Required"

        });

    }

    const sql = `

        UPDATE orders

        SET order_status = 'Accepted'

        WHERE id = ?

        AND order_status = 'Pending'

    `;

    db.query(sql, [order_id], (err, result) => {

        if (err) {

            console.log(err);

            return res.status(500).json({

                success: false,

                message: "Database Error"

            });

        }

        if (result.affectedRows === 0) {

            return res.status(400).json({

                success: false,

                message: "Order cannot be accepted"

            });

        }

        res.status(200).json({

            success: true,

            message: "Order Accepted Successfully",

            status: "Accepted"

        });

    });

};


// ======================================
// ACCEPT ALL PENDING ORDERS
// ======================================

exports.acceptAllOrders = (req, res) => {

    const sql = `

        UPDATE orders

        SET order_status = 'Accepted'

        WHERE order_status = 'Pending'

    `;

    db.query(sql, (err, result) => {

        if (err) {

            console.log(err);

            return res.status(500).json({

                success: false,

                message: "Database Error"

            });

        }

        res.status(200).json({

            success: true,

            message: `${result.affectedRows} Pending Orders Accepted Successfully`

        });

    });

};
// ======================================
// PREPARING ORDER
// Accepted → Preparing
// ======================================

exports.preparingOrder = (req, res) => {

    const { order_id } = req.body;

    if (!order_id) {

        return res.status(400).json({

            success: false,

            message: "Order ID Required"

        });

    }

    const sql = `

        UPDATE orders

        SET order_status = 'Preparing'

        WHERE id = ?

        AND order_status = 'Accepted'

    `;

    db.query(sql, [order_id], (err, result) => {

        if (err) {

            console.log(err);

            return res.status(500).json({

                success: false,

                message: "Database Error"

            });

        }

        if (result.affectedRows === 0) {

            return res.status(400).json({

                success: false,

                message: "Order cannot move to Preparing"

            });

        }

        res.status(200).json({

            success: true,

            message: "Order is Preparing",

            status: "Preparing"

        });

    });

};


// ======================================
// READY ORDER
// Preparing → Ready
// ======================================

exports.readyOrder = (req, res) => {

    const { order_id } = req.body;

    if (!order_id) {

        return res.status(400).json({

            success: false,

            message: "Order ID Required"

        });

    }

    const sql = `

        UPDATE orders

        SET order_status = 'Ready'

        WHERE id = ?

        AND order_status = 'Preparing'

    `;

    db.query(sql, [order_id], (err, result) => {

        if (err) {

            console.log(err);

            return res.status(500).json({

                success: false,

                message: "Database Error"

            });

        }

        if (result.affectedRows === 0) {

            return res.status(400).json({

                success: false,

                message: "Order cannot move to Ready"

            });

        }

        res.status(200).json({

            success: true,

            message: "Order is Ready",

            status: "Ready"

        });

    });

};


// ======================================
// COMPLETE ORDER
// Ready → Completed
exports.completeOrder = (req, res) => {

    const { order_id } = req.body;

    if (!order_id) {

        return res.status(400).json({

            success: false,
            message: "Order ID Required"

        });

    }

    // ===============================
    // STEP 1 : COMPLETE ORDER
    // ===============================

    const completeSQL = `
        UPDATE orders
        SET order_status = 'Completed'
        WHERE id = ?
        AND order_status = 'Ready'
    `;

    db.query(completeSQL, [order_id], (err, result) => {

        if (err) {

            console.log(err);

            return res.status(500).json({

                success: false,
                message: "Database Error"

            });

        }

        if (result.affectedRows === 0) {

            return res.status(400).json({

                success: false,
                message: "Order cannot be completed"

            });

        }

        // ===============================
        // STEP 2 : DEDUCT INVENTORY
        // ===============================

      const deductStockSQL = `
    UPDATE inventory i
    JOIN order_items oi
    ON i.menu_id = oi.menu_id

    SET
        i.current_stock = i.current_stock - oi.quantity,
        i.stock_quantity = i.current_stock - oi.quantity,
        i.online_sold = i.online_sold + oi.quantity

    WHERE oi.order_id = ?
`;

        db.query(deductStockSQL, [order_id], (stockErr) => {

            if (stockErr) {

                console.log(stockErr);

                return res.status(500).json({

                    success: false,
                    message: "Inventory Update Failed"

                });

            }

            // ===============================
            // STEP 3 : FREE TABLE
            // ===============================

            const freeTableSQL = `
                UPDATE restaurant_tables
                SET
                    status = 'Available',
                    current_order_id = NULL
                WHERE current_order_id = ?
            `;

            db.query(freeTableSQL, [order_id], (tableErr) => {

                if (tableErr) {

                    console.log(tableErr);

                }

                return res.status(200).json({

                    success: true,
                    message: "Order Completed Successfully",
                    status: "Completed"

                });

            });

        });

    });

};



// ======================================
// UPDATE ORDER
// ======================================

exports.updateOrder = (req, res) => {

    const {

        order_id,

        total_amount

    } = req.body;

    if (!order_id) {

        return res.status(400).json({

            success: false,

            message: "Order ID Required"

        });

    }

    const sql = `

        UPDATE orders

        SET total_amount = ?

        WHERE id = ?

        AND order_status = 'Pending'

    `;

    db.query(

        sql,

        [

            total_amount,

            order_id

        ],

        (err, result) => {

            if (err) {

                console.log(err);

                return res.status(500).json({

                    success: false,

                    message: "Database Error"

                });

            }

            if (result.affectedRows === 0) {

                return res.status(400).json({

                    success: false,

                    message: "Only Pending Order Can Be Updated"

                });

            }

            res.status(200).json({

                success: true,

                message: "Order Updated Successfully"

            });

        }

    );

};


// ======================================
// CANCEL ORDER
// Pending → Cancelled
// ======================================

exports.cancelOrder = (req, res) => {

    const {

        order_id

    } = req.body;

    if (!order_id) {

        return res.status(400).json({

            success: false,

            message: "Order ID Required"

        });

    }

    const sql = `

        UPDATE orders

        SET order_status = 'Cancelled'

        WHERE id = ?

        AND order_status = 'Pending'

    `;

    db.query(

        sql,

        [

            order_id

        ],

        (err, result) => {

            if (err) {

                console.log(err);

                return res.status(500).json({

                    success: false,

                    message: "Database Error"

                });

            }

            if (result.affectedRows === 0) {

                return res.status(400).json({

                    success: false,

                    message: "Only Pending Order Can Be Cancelled"

                });

            }

            res.status(200).json({

                success: true,

                message: "Order Cancelled Successfully"

            });

        }

    );

};
// ======================================
// RECEIVE PAYMENT
// ======================================

exports.receivePayment = (req, res) => {

    const {

        order_id,

        payment_method

    } = req.body;

    if (!order_id || !payment_method) {

        return res.status(400).json({

            success: false,

            message: "Order ID and Payment Method Required"

        });

    }

    const sql = `

        UPDATE orders

        SET

            payment_status = 'Paid',

            payment_method = ?

        WHERE id = ?

    `;

    db.query(

        sql,

        [

            payment_method,

            order_id

        ],

        (err, result) => {

            if (err) {

                console.log(err);

                return res.status(500).json({

                    success: false,

                    message: "Payment Update Failed"

                });

            }

            if (result.affectedRows === 0) {

                return res.status(404).json({

                    success: false,

                    message: "Order Not Found"

                });

            }

            res.status(200).json({

                success: true,

                message: "Payment Received Successfully",

                status: "Paid"

            });

        }

    );

};


// ======================================
// GET PENDING PAYMENTS
// ======================================

exports.getPendingPayments = (req, res) => {

    const sql = `

        SELECT

            orders.*,

            customers.name AS customer_name,

            customers.phone

        FROM orders

        LEFT JOIN customers

        ON orders.customer_id = customers.id

        WHERE orders.payment_status = 'Pending'

        ORDER BY orders.id DESC

    `;

    db.query(sql, (err, result) => {

        if (err) {

            console.log(err);

            return res.status(500).json({

                success: false,

                message: "Database Error"

            });

        }

        res.status(200).json({

            success: true,

            pendingPayments: result

        });

    });

};


// ======================================
// GET ORDER BY TOKEN
// ======================================

exports.getOrderByToken = (req, res) => {

    const { token } = req.params;

    if (!token) {

        return res.status(400).json({

            success: false,

            message: "Token Required"

        });

    }

    const orderSQL = `

        SELECT

            orders.*,

            customers.name AS customer_name,

            customers.phone

        FROM orders

        LEFT JOIN customers

        ON orders.customer_id = customers.id

        WHERE orders.token_number = ?

    `;

    db.query(

        orderSQL,

        [token],

        (err, result) => {

            if (err) {

                console.log(err);

                return res.status(500).json({

                    success: false,

                    message: "Database Error"

                });

            }

            if (result.length === 0) {

                return res.status(404).json({

                    success: false,

                    message: "Order Not Found"

                });

            }

            const order = result[0];

            const itemSQL = `

                SELECT

                    order_items.*,

                    menu.name

                FROM order_items

                LEFT JOIN menu

                ON order_items.menu_id = menu.id

                WHERE order_id = ?

            `;

            db.query(

                itemSQL,

                [order.id],

                (itemErr, items) => {

                    if (itemErr) {

                        console.log(itemErr);

                        return res.status(500).json({

                            success: false,

                            message: "Items Fetch Error"

                        });

                    }

                    res.status(200).json({

                        success: true,

                        order: {

                            ...order,

                            items

                        }

                    });

                }

            );

        }

    );

};
// =====================================
// START PREPARING ALL ACCEPTED ORDERS
// =====================================

exports.preparingAllOrders = (req, res) => {

    const sql = `
        UPDATE orders
        SET order_status = 'Preparing'
        WHERE order_status = 'Accepted'
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

            message: `${result.affectedRows} Orders Moved To Preparing`

        });

    });

};