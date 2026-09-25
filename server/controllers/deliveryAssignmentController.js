const db = require("../config/db");


// ======================================================
// AUTO ASSIGN WAITING DELIVERY
// ======================================================
// এই function:
//
// 1. Available DeliveryBoy খুঁজবে
// 2. Waiting Delivery Order খুঁজবে
// 3. Automatically assignment তৈরি করবে
//
// এটি createOrder() থেকেও callback দিয়ে call করা যাবে.
// ======================================================

exports.autoAssignWaitingDelivery = (callback) => {

    console.log("🔄 AUTO ASSIGN WAITING DELIVERY STARTED");


    // ==================================================
    // STEP 1 : FIND AVAILABLE DELIVERY BOY
    // ==================================================

    const findBoySQL = `

        SELECT
            s.id,
            s.name,
            s.phone,
            s.work_start_time,
            s.work_end_time

        FROM staff s

        WHERE s.role = 'DeliveryBoy'

        AND s.status = 'Active'
AND s.online_status = 'Online'
AND s.on_leave = 0
       AND ADDTIME(CURTIME(), '05:30:00') BETWEEN
    s.work_start_time
    AND s.work_end_time

        AND NOT EXISTS (

            SELECT 1

            FROM delivery_assignments da

            WHERE da.delivery_boy_id = s.id

            AND da.status IN (
                'Assigned',
                'Accepted',
                'OutForDelivery'
            )

        )

        ORDER BY s.id ASC

        LIMIT 1

    `;


    db.query(
        findBoySQL,
        [],
        (boyErr, boyResult) => {

            if (boyErr) {

                console.log(
                    "❌ AUTO ASSIGN BOY SEARCH ERROR:",
                    boyErr
                );

                return callback(
                    boyErr,
                    null
                );
            }


            // ==================================================
            // NO DELIVERY BOY AVAILABLE
            // ==================================================

            if (boyResult.length === 0) {

                console.log(
                    "⏳ NO DELIVERY BOY AVAILABLE RIGHT NOW"
                );

                return callback(
                    null,
                    null
                );
            }


            const deliveryBoy =
                boyResult[0];


            console.log(
                "🚚 AVAILABLE DELIVERY BOY FOUND:",
                deliveryBoy.id
            );


            // ==================================================
            // STEP 2 : FIND OLDEST WAITING DELIVERY ORDER
            // ==================================================

            const findOrderSQL = `

                SELECT
                    o.id,
                    o.order_status,
                    o.order_type

                FROM orders o

                LEFT JOIN delivery_assignments da
                    ON o.id = da.order_id

                WHERE o.order_type = 'Delivery'

                AND da.id IS NULL

                AND o.order_status IN (
                    'Pending',
                    'Accepted',
                    'Preparing',
                    'Ready'
                )

                ORDER BY o.id ASC

                LIMIT 1

            `;


            db.query(
                findOrderSQL,
                [],
                (orderErr, orderResult) => {

                    if (orderErr) {

                        console.log(
                            "❌ FIND WAITING ORDER ERROR:",
                            orderErr
                        );

                        return callback(
                            orderErr,
                            null
                        );
                    }


                    // ==================================================
                    // NO WAITING DELIVERY ORDER
                    // ==================================================

                    if (orderResult.length === 0) {

                        console.log(
                            "ℹ️ NO WAITING DELIVERY ORDER"
                        );

                        return callback(
                            null,
                            null
                        );
                    }


                    const order =
                        orderResult[0];


                    console.log(
                        "📦 WAITING ORDER FOUND:",
                        order.id
                    );


                    // ==================================================
                    // STEP 3 : CREATE ASSIGNMENT
                    // ==================================================

                    const insertSQL = `

                        INSERT INTO delivery_assignments
                        (
                            order_id,
                            delivery_boy_id,
                            status
                        )

                        VALUES
                        (?, ?, 'Assigned')

                    `;


                    db.query(
                        insertSQL,
                        [
                            order.id,
                            deliveryBoy.id
                        ],
                        (insertErr, insertResult) => {

                            if (insertErr) {

                                console.log(
                                    "❌ AUTO ASSIGN INSERT ERROR:",
                                    insertErr
                                );

                                return callback(
                                    insertErr,
                                    null
                                );
                            }


                            console.log(
                                "✅ WAITING ORDER AUTOMATICALLY ASSIGNED"
                            );

                            console.log(
                                "Assignment ID =",
                                insertResult.insertId
                            );

                            console.log(
                                "Order ID =",
                                order.id
                            );

                            console.log(
                                "Delivery Boy ID =",
                                deliveryBoy.id
                            );


                            return callback(
                                null,
                                {
                                    assignmentId:
                                        insertResult.insertId,

                                    orderId:
                                        order.id,

                                    deliveryBoyId:
                                        deliveryBoy.id,

                                    deliveryBoyName:
                                        deliveryBoy.name,

                                    deliveryBoyPhone:
                                        deliveryBoy.phone,

                                    status:
                                        "Assigned"
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
// ASSIGN AVAILABLE DELIVERY BOY TO ORDER
// ======================================================
// এটি manual/API route-এর জন্য।
//
// POST /assign-delivery
//
// body:
// {
//     "order_id": 123
// }
// ======================================================

exports.assignDeliveryBoy = (req, res) => {

    const {
        order_id
    } = req.body;


    // ==================================================
    // STEP 1 : VALIDATION
    // ==================================================

    if (!order_id) {

        return res.status(400).json({

            success: false,

            message:
                "Order ID is required"

        });
    }


    // ==================================================
    // STEP 2 : CHECK ORDER
    // ==================================================

    const checkOrderSQL = `

        SELECT
            id,
            order_status,
            order_type,
            shop_id,
            customer_id

        FROM orders

        WHERE id = ?

    `;


    db.query(
        checkOrderSQL,
        [order_id],
        (orderErr, orderResult) => {

            if (orderErr) {

                console.log(
                    "❌ CHECK ORDER ERROR:",
                    orderErr
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "Database Error"

                });
            }


            // ==================================================
            // ORDER NOT FOUND
            // ==================================================

            if (orderResult.length === 0) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Order Not Found"

                });
            }


            const order =
                orderResult[0];


            console.log(
                "========== DELIVERY ASSIGNMENT =========="
            );

            console.log(
                "Order ID =",
                order.id
            );

            console.log(
                "Order Type =",
                order.order_type
            );

            console.log(
                "Order Status =",
                order.order_status
            );

            console.log(
                "Shop ID =",
                order.shop_id
            );

            console.log(
                "Customer ID =",
                order.customer_id
            );

            console.log(
                "========================================="
            );


            // ==================================================
            // STEP 3 : CHECK ORDER TYPE
            // ==================================================

            if (
                order.order_type !==
                "Delivery"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Only Delivery orders can be assigned to a Delivery Boy"

                });
            }


            // ==================================================
            // STEP 4 : CHECK EXISTING ASSIGNMENT
            // ==================================================

            const checkAssignmentSQL = `

                SELECT
                    id,
                    delivery_boy_id,
                    status

                FROM delivery_assignments

                WHERE order_id = ?

            `;


            db.query(
                checkAssignmentSQL,
                [order_id],
                (assignmentErr, assignmentResult) => {

                    if (assignmentErr) {

                        console.log(
                            "❌ CHECK ASSIGNMENT ERROR:",
                            assignmentErr
                        );

                        return res.status(500).json({

                            success: false,

                            message:
                                "Database Error"

                        });
                    }


                    // ==================================================
                    // ORDER ALREADY ASSIGNED
                    // ==================================================

                    if (
                        assignmentResult.length > 0
                    ) {

                        return res.status(400).json({

                            success: false,

                            message:
                                "Delivery Boy already assigned to this order",

                            assignment:
                                assignmentResult[0]

                        });
                    }


                    // ==================================================
                    // STEP 5 : FIND AVAILABLE DELIVERY BOY
                    // ==================================================

                    const findAvailableBoySQL = `

                        SELECT
                            s.id,
                            s.name,
                            s.phone,
                            s.work_start_time,
                            s.work_end_time

                        FROM staff s

                        WHERE s.role = 'DeliveryBoy'

                        AND s.status = 'Active'

                      AND ADDTIME(CURTIME(), '05:30:00')
    BETWEEN s.work_start_time AND s.work_end_time

                        AND NOT EXISTS (

                            SELECT 1

                            FROM delivery_assignments da

                            WHERE da.delivery_boy_id = s.id

                            AND da.status IN (
                                'Assigned',
                                'Accepted',
                                'OutForDelivery'
                            )

                        )

                        ORDER BY s.id ASC

                        LIMIT 1

                    `;


                    db.query(
                        findAvailableBoySQL,
                        [],
                        (boyErr, boyResult) => {

                            if (boyErr) {

                                console.log(
                                    "❌ FIND AVAILABLE DELIVERY BOY ERROR:",
                                    boyErr
                                );

                                return res.status(500).json({

                                    success: false,

                                    message:
                                        "Failed to find available Delivery Boy",

                                    error:
                                        boyErr.sqlMessage ||
                                        boyErr.message

                                });
                            }


                            // ==================================================
                            // NO DELIVERY BOY AVAILABLE
                            // ==================================================

                            if (
                                boyResult.length === 0
                            ) {

                                console.log(
                                    "⚠️ NO DELIVERY BOY AVAILABLE"
                                );

                                return res.status(409).json({

                                    success: false,

                                    message:
                                        "No Delivery Boy is currently available"

                                });
                            }


                            const deliveryBoy =
                                boyResult[0];


                            console.log(
                                "========== AVAILABLE DELIVERY BOY =========="
                            );

                            console.log(
                                "ID =",
                                deliveryBoy.id
                            );

                            console.log(
                                "Name =",
                                deliveryBoy.name
                            );

                            console.log(
                                "Phone =",
                                deliveryBoy.phone
                            );

                            console.log(
                                "============================================="
                            );


                            // ==================================================
                            // STEP 6 : CREATE ASSIGNMENT
                            // ==================================================

                            const insertAssignmentSQL = `

                                INSERT INTO delivery_assignments
                                (
                                    order_id,
                                    delivery_boy_id,
                                    status
                                )

                                VALUES
                                (?, ?, 'Assigned')

                            `;


                            db.query(
                                insertAssignmentSQL,
                                [
                                    order_id,
                                    deliveryBoy.id
                                ],
                                (insertErr, insertResult) => {

                                    if (insertErr) {

                                        console.log(
                                            "❌ CREATE ASSIGNMENT ERROR:",
                                            insertErr
                                        );

                                        return res.status(500).json({

                                            success: false,

                                            message:
                                                "Delivery Assignment Failed",

                                            error:
                                                insertErr.sqlMessage ||
                                                insertErr.message

                                        });
                                    }


                                    // ==================================================
                                    // SUCCESS
                                    // ==================================================

                                    console.log(
                                        "✅ DELIVERY BOY ASSIGNED"
                                    );


                                    console.log(
                                        "Assignment ID =",
                                        insertResult.insertId
                                    );

                                    console.log(
                                        "Order ID =",
                                        order_id
                                    );

                                    console.log(
                                        "Delivery Boy ID =",
                                        deliveryBoy.id
                                    );


                                    return res.status(201).json({

                                        success: true,

                                        message:
                                            "Delivery Boy Assigned Successfully",

                                        assignmentId:
                                            insertResult.insertId,

                                        orderId:
                                            order_id,

                                        deliveryBoyId:
                                            deliveryBoy.id,

                                        deliveryBoyName:
                                            deliveryBoy.name,

                                        deliveryBoyPhone:
                                            deliveryBoy.phone,

                                        status:
                                            "Assigned"

                                    });

                                }
                            );

                        }
                    );

                }
            );

        }
    );

};

const calculateDistanceKm = (
    lat1,
    lon1,
    lat2,
    lon2
) => {

    const R = 6371;

    const dLat =
        (lat2 - lat1) *
        Math.PI / 180;

    const dLon =
        (lon2 - lon1) *
        Math.PI / 180;

    const a =
        Math.sin(dLat / 2) *
        Math.sin(dLat / 2) +

        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *

        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );

    return Number(
        (R * c).toFixed(2)
    );
};

// ======================================================
// ACCEPT DELIVERY
// ======================================================
// Assigned → Accepted
//
// DeliveryBoy dashboard থেকে Accept button চাপলে
// এই API call হবে.
// ======================================================

exports.acceptDelivery = (req, res) => {

    console.log(
        "🚚 ACCEPT DELIVERY ROUTE HIT"
    );


    const assignmentId =
        req.params.assignmentId;


    if (!assignmentId) {

        return res.status(400).json({

            success: false,

            message:
                "Assignment ID is required"

        });
    }


    // ==================================================
    // GET DELIVERY BOY ID FROM JWT
    // ==================================================

    const deliveryBoyId =
        req.user?.id ||
        req.user?.userId ||
        req.user?.staffId;


    if (!deliveryBoyId) {

        console.log(
            "❌ DELIVERY BOY ID NOT FOUND"
        );

        return res.status(401).json({

            success: false,

            message:
                "Delivery Boy ID not found in authentication token"

        });
    }


    console.log(
        "🚚 DELIVERY BOY ID =",
        deliveryBoyId
    );

    console.log(
        "📦 ASSIGNMENT ID =",
        assignmentId
    );


    // ==================================================
    // CHECK ASSIGNMENT
    // ==================================================

 const checkAssignmentSQL = `

    SELECT
        da.id,
        da.order_id,
        da.delivery_boy_id,
        da.status,

        c.latitude AS customer_latitude,
        c.longitude AS customer_longitude,

        ss.latitude AS shop_latitude,
        ss.longitude AS shop_longitude

    FROM delivery_assignments da

    JOIN orders o
        ON da.order_id = o.id

    JOIN customers c
        ON o.customer_id = c.id

    JOIN shop_settings ss
        ON o.shop_id = ss.id

    WHERE da.id = ?

    AND da.delivery_boy_id = ?

`;


    db.query(
        checkAssignmentSQL,
        [
            assignmentId,
            deliveryBoyId
        ],
        (checkErr, checkResult) => {

            if (checkErr) {

                console.log(
                    "❌ CHECK ACCEPT DELIVERY ERROR:",
                    checkErr
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "Database Error",

                    error:
                        checkErr.sqlMessage ||
                        checkErr.message

                });
            }


            if (
                checkResult.length === 0
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Delivery assignment not found"

                });
            }


            const assignment =
                checkResult[0];
                console.log("📍 SHOP LAT =", assignment.shop_latitude);
console.log("📍 SHOP LNG =", assignment.shop_longitude);
console.log("📍 CUSTOMER LAT =", assignment.customer_latitude);
console.log("📍 CUSTOMER LNG =", assignment.customer_longitude);
let distanceKm = null;

if (
    assignment.shop_latitude !== null &&
    assignment.shop_longitude !== null &&
    assignment.customer_latitude !== null &&
    assignment.customer_longitude !== null
) {

    distanceKm = calculateDistanceKm(
        Number(assignment.shop_latitude),
        Number(assignment.shop_longitude),

        Number(assignment.customer_latitude),
        Number(assignment.customer_longitude)
    );

    console.log(
        "📏 SHOP → CUSTOMER DISTANCE =",
        distanceKm,
        "KM"
    );

} else {

    console.log(
        "⚠️ SHOP/CUSTOMER LOCATION MISSING"
    );

}

            // ==================================================
            // ONLY ASSIGNED CAN BE ACCEPTED
            // ==================================================

            if (
                assignment.status !==
                "Assigned"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        `Cannot accept delivery. Current status is ${assignment.status}`

                });
            }


            // ==================================================
            // UPDATE STATUS
            // ==================================================

            const acceptSQL = `

    UPDATE delivery_assignments

    SET
        status = 'Accepted',
        accepted_at = NOW(),
        distance_km = ?

    WHERE id = ?

    AND delivery_boy_id = ?

    AND status = 'Assigned'

`;

            db.query(
                acceptSQL,
               [
    distanceKm,
    assignmentId,
    deliveryBoyId
],
                (acceptErr, acceptResult) => {

                    if (acceptErr) {

                        console.log(
                            "❌ ACCEPT DELIVERY ERROR:",
                            acceptErr
                        );

                        return res.status(500).json({

                            success: false,

                            message:
                                "Failed to accept delivery",

                            error:
                                acceptErr.sqlMessage ||
                                acceptErr.message

                        });
                    }


                    if (
                        acceptResult.affectedRows === 0
                    ) {

                        return res.status(400).json({

                            success: false,

                            message:
                                "Delivery could not be accepted"

                        });
                    }


                    console.log(
                        "✅ DELIVERY ACCEPTED"
                    );
console.log("🔥 FINAL DISTANCE BEFORE RESPONSE =", distanceKm);

console.log("🔥 FINAL RESPONSE DATA =", {
    assignmentId: Number(assignmentId),
    orderId: assignment.order_id,
    distanceKm: distanceKm
});


                    return res.json({

                        success: true,

                        message:
                            "Delivery accepted successfully",

                        assignmentId:
                            Number(assignmentId),

                        orderId:
                            assignment.order_id,

                        deliveryBoyId:
                            deliveryBoyId,

                        status:
                            "Accepted",
                         distanceKm:
        distanceKm   

                    });

                }
            );

        }
    );

};



// ======================================================
// GET MY DELIVERY ORDERS
// ======================================================

exports.getMyDeliveryOrders = (req, res) => {

    console.log(
        "🚚 GET MY DELIVERY ORDERS"
    );

    console.log(
        "AUTH USER =",
        req.user
    );


    const deliveryBoyId =
        req.user?.id ||
        req.user?.userId ||
        req.user?.staffId;


    if (!deliveryBoyId) {

        return res.status(401).json({

            success: false,

            message:
                "Delivery Boy ID not found in authentication token"

        });
    }


    const ordersSQL = `

     SELECT

            da.id AS assignment_id,

            da.order_id,

            da.delivery_boy_id,
da.status AS delivery_status,

DATE_FORMAT(
    DATE_ADD(
        da.assigned_at,
        INTERVAL 330 MINUTE
    ),
    '%d/%m/%Y, %h:%i:%s %p'
) AS assigned_at,

da.accepted_at,
da.out_for_delivery_at,
da.delivered_at,

            o.order_status,

            o.total_amount,
o.cashback_amount,
o.cashback_status,
o.cashback_paid_by,
o.cashback_paid_at,
            o.token_number,

            o.order_type,

            o.payment_status,

            o.payment_method,

            o.shop_id,

            c.id AS customer_id,
c.pending_cancellation_amount,
            c.name AS customer_name,

            c.phone AS customer_phone,

            c.delivery_address,
o.delivery_landmark,
            c.latitude AS customer_latitude,

            c.longitude AS customer_longitude,

            ss.shop_name,

            ss.phone AS shop_phone,
            ss.owner_name,
               ss.upi_id,

            ss.latitude AS shop_latitude,

            ss.longitude AS shop_longitude

        FROM delivery_assignments da

        INNER JOIN orders o
            ON da.order_id = o.id

        LEFT JOIN customers c
            ON o.customer_id = c.id

        LEFT JOIN shop_settings ss
            ON o.shop_id = ss.id

        WHERE da.delivery_boy_id = ?

        ORDER BY da.id DESC

    `;


    db.query(
        ordersSQL,
        [deliveryBoyId],
        (orderErr, orderResult) => {

            if (orderErr) {

                console.log(
                    "❌ GET MY DELIVERY ORDERS ERROR:",
                    orderErr
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "Failed to fetch delivery orders",

                    error:
                        orderErr.sqlMessage ||
                        orderErr.message

                });
            }


            if (
                orderResult.length === 0
            ) {

                return res.json({

                    success: true,

                    count: 0,

                    orders: []

                });
            }


            // ==================================================
            // GET ORDER ITEMS
            // ==================================================

            const orderIds =
                orderResult.map(
                    order =>
                        order.order_id
                );


            const placeholders =
                orderIds
                    .map(() => "?")
                    .join(",");


            const itemsSQL = `

                SELECT

                    oi.id,

                    oi.order_id,

                    oi.menu_id,

                    oi.quantity,

                    oi.price,

                    oi.subtotal,

                    m.name AS item_name,

                    m.category,

                    m.serving_type,

                    m.serving_size,

                    m.plate_type

                FROM order_items oi

                LEFT JOIN menu m
                    ON oi.menu_id = m.id

                WHERE oi.order_id IN (${placeholders})

                ORDER BY oi.id ASC

            `;


            db.query(
                itemsSQL,
                orderIds,
                (itemsErr, itemsResult) => {

                    if (itemsErr) {

                        console.log(
                            "❌ GET DELIVERY ORDER ITEMS ERROR:",
                            itemsErr
                        );

                        return res.status(500).json({

                            success: false,

                            message:
                                "Failed to fetch order items",

                            error:
                                itemsErr.sqlMessage ||
                                itemsErr.message

                        });
                    }


                    // ==================================================
                    // ATTACH ITEMS
                    // ==================================================

                    const orders =
                        orderResult.map(
                            order => {

                                const items =
                                    itemsResult.filter(
                                        item =>
                                            Number(item.order_id) ===
                                            Number(order.order_id)
                                    );


                                return {

                                    assignment_id:
                                        order.assignment_id,

                                    order_id:
                                        order.order_id,

                                    delivery_boy_id:
                                        order.delivery_boy_id,

                                    delivery_status:
                                        order.delivery_status,

                                    assigned_at:
                                        order.assigned_at,

                                    accepted_at:
                                        order.accepted_at,

                                    out_for_delivery_at:
                                        order.out_for_delivery_at,

                                    delivered_at:
                                        order.delivered_at,

                                    order_status:
                                        order.order_status,

                                    total_amount:
                                        order.total_amount,

                                    token_number:
                                        order.token_number,

                                    order_type:
                                        order.order_type,
                                   
cashback_amount: Number(order.cashback_amount || 0),
cashback_status: order.cashback_status,
cashback_paid_by: order.cashback_paid_by,
cashback_paid_at: order.cashback_paid_at,     

                                    payment_status:
                                        order.payment_status,

                                    payment_method:
                                        order.payment_method,


                                    // ==============================
                                    // CUSTOMER
                                    // ==============================

                                    customer_id:
                                        order.customer_id,
pending_cancellation_amount:
    order.pending_cancellation_amount,
                                    customer_name:
                                        order.customer_name,

                                    customer_phone:
                                        order.customer_phone,

                                    delivery_address:
                                        order.delivery_address,
delivery_landmark:
    order.delivery_landmark,
                                    customer_latitude:
                                        order.customer_latitude,

                                    customer_longitude:
                                        order.customer_longitude,


                                    // ==============================
                                    // SHOP
                                    // ==============================

                                    shop_id:
                                        order.shop_id,

                                    shop_name:
                                        order.shop_name,

                                    shop_phone:
                                        order.shop_phone,
owner_name:
    order.owner_name,

owner_upi_id:
    order.upi_id,
                                    shop_latitude:
                                        order.shop_latitude,

                                    shop_longitude:
                                        order.shop_longitude,


                                    // ==============================
                                    // ITEMS
                                    // ==============================

                                    items:
                                        items

                                };

                            }
                        );


                    console.log(
                        "✅ MY DELIVERY ORDERS RESPONSE READY"
                    );


                    return res.json({

                        success: true,

                        count:
                            orders.length,

                        orders:
                            orders

                    });

                }
            );

        }
    );

};



// ======================================================
// UPDATE DELIVERY BOY GPS LOCATION
// ======================================================
// GPS শুধু:
//
// Accepted
// অথবা
// OutForDelivery
//
// অবস্থায় update হবে.
// ======================================================
// ======================================================
// UPDATE DELIVERY BOY ONLINE / OFFLINE STATUS
// ======================================================

exports.updateOnlineStatus = (req, res) => {

    console.log("🟢 UPDATE DELIVERY BOY ONLINE STATUS");

    // JWT থেকে DeliveryBoy ID
    const deliveryBoyId =
        req.user?.id ||
        req.user?.userId ||
        req.user?.staffId;

    if (!deliveryBoyId) {

        return res.status(401).json({
            success: false,
            message: "Delivery Boy ID not found in authentication token"
        });

    }

    const { online_status } = req.body;

    // শুধুমাত্র Online / Offline allowed
    if (
        online_status !== "Online" &&
        online_status !== "Offline"
    ) {

        return res.status(400).json({
            success: false,
            message: "online_status must be Online or Offline"
        });

    }

    const updateSQL = `
        UPDATE staff
        SET online_status = ?
        WHERE id = ?
        AND role = 'DeliveryBoy'
        AND status = 'Active'
    AND (
        ? = 'Offline'
        OR on_leave = 0
    )
    `;

    db.query(
        updateSQL,
        [
            online_status,
            deliveryBoyId,
            online_status
        ],
        (err, result) => {

            if (err) {

                console.log(
                    "❌ UPDATE ONLINE STATUS ERROR:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: "Failed to update online status",
                    error:
                        err.sqlMessage ||
                        err.message
                });

            }

            if (result.affectedRows === 0) {

                return res.status(404).json({
                    success: false,
                    message: "Delivery Boy not found"
                });

            }

            console.log(
                "✅ ONLINE STATUS UPDATED:",
                online_status
            );

            return res.json({

                success: true,

                message:
                    `Delivery Boy is now ${online_status}`,

                deliveryBoyId:
                    deliveryBoyId,

                online_status:
                    online_status

            });

        }
    );

};


            // ==================================================
            // SAVE GPS
            // ==================================================

            

              




// ======================================================
// PICKUP DELIVERY
// ======================================================
// Accepted → OutForDelivery
//
// Pickup button চাপলে:
// 1. Assignment status change
// 2. out_for_delivery_at save
// 3. এরপর GPS চলবে
// ======================================================

exports.pickupDelivery = (req, res) => {

    console.log(
        "📦 PICKUP DELIVERY ROUTE HIT"
    );


    const assignmentId =
        req.params.assignmentId;


    if (!assignmentId) {

        return res.status(400).json({

            success: false,

            message:
                "Assignment ID is required"

        });
    }


    const deliveryBoyId =
        req.user?.id ||
        req.user?.userId ||
        req.user?.staffId;


    if (!deliveryBoyId) {

        return res.status(401).json({

            success: false,

            message:
                "Delivery Boy ID not found in authentication token"

        });
    }


    const checkSQL = `

        SELECT
            id,
            order_id,
            delivery_boy_id,
            status

        FROM delivery_assignments

        WHERE id = ?

        AND delivery_boy_id = ?

    `;


    db.query(
        checkSQL,
        [
            assignmentId,
            deliveryBoyId
        ],
        (err, result) => {

            if (err) {

                console.log(
                    "❌ CHECK PICKUP ERROR:",
                    err
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "Database Error",

                    error:
                        err.sqlMessage ||
                        err.message

                });
            }


            if (
                result.length === 0
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Delivery assignment not found"

                });
            }


            const assignment =
                result[0];


            // ==================================================
            // ONLY ACCEPTED CAN BE PICKED UP
            // ==================================================

            if (
                assignment.status !==
                "Accepted"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        `Cannot pickup delivery. Current status is ${assignment.status}`

                });
            }


            const pickupSQL = `

                UPDATE delivery_assignments

                SET

                    status =
                        'OutForDelivery',

                    out_for_delivery_at =
                        NOW()

                WHERE id = ?

                AND delivery_boy_id = ?

                AND status = 'Accepted'

            `;


            db.query(
                pickupSQL,
                [
                    assignmentId,
                    deliveryBoyId
                ],
                (updateErr, updateResult) => {

                    if (updateErr) {

                        console.log(
                            "❌ PICKUP DELIVERY ERROR:",
                            updateErr
                        );

                        return res.status(500).json({

                            success: false,

                            message:
                                "Failed to pickup delivery",

                            error:
                                updateErr.sqlMessage ||
                                updateErr.message

                        });
                    }


                    if (
                        updateResult.affectedRows === 0
                    ) {

                        return res.status(400).json({

                            success: false,

                            message:
                                "Delivery could not be picked up"

                        });
                    }


                    console.log(
                        "📦 ORDER PICKED UP"
                    );


                    return res.json({

                        success: true,

                        message:
                            "Order picked up successfully",

                        assignmentId:
                            Number(assignmentId),

                        orderId:
                            assignment.order_id,

                        deliveryBoyId:
                            deliveryBoyId,

                        status:
                            "OutForDelivery"

                    });

                }
            );

        }
    );

};



// ======================================================
// DELIVER DELIVERY
// ======================================================
// OutForDelivery → Delivered
// Order → Completed
// ======================================================

// ======================================================
// DELIVER DELIVERY
// ======================================================

exports.deliverDelivery = (req, res) => {

    console.log("✅ DELIVER DELIVERY ROUTE HIT");

    // ==================================================
    // STEP 1 : GET ASSIGNMENT ID
    // ==================================================

    const assignmentId = req.params.assignmentId;

    if (!assignmentId) {

        return res.status(400).json({
            success: false,
            message: "Assignment ID is required"
        });

    }

    // ==================================================
    // STEP 2 : GET DELIVERY BOY ID FROM JWT
    // ==================================================

    const deliveryBoyId =
        req.user?.id ||
        req.user?.userId ||
        req.user?.staffId;

    if (!deliveryBoyId) {

        return res.status(401).json({
            success: false,
            message:
                "Delivery Boy ID not found in authentication token"
        });

    }

    console.log(
        "🚚 DELIVERY BOY ID =",
        deliveryBoyId
    );

    console.log(
        "📦 ASSIGNMENT ID =",
        assignmentId
    );

    // ==================================================
    // STEP 3 : CHECK ASSIGNMENT
    // ==================================================

    const checkSQL = `

        SELECT
            id,
            order_id,
            delivery_boy_id,
            status

        FROM delivery_assignments

        WHERE id = ?

        AND delivery_boy_id = ?

    `;

    db.query(
        checkSQL,
        [
            assignmentId,
            deliveryBoyId
        ],
        (checkErr, checkResult) => {

            if (checkErr) {

                console.log(
                    "❌ CHECK DELIVER DELIVERY ERROR:",
                    checkErr
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "Database Error",

                    error:
                        checkErr.sqlMessage ||
                        checkErr.message

                });

            }

            // ==================================================
            // ASSIGNMENT NOT FOUND
            // ==================================================

            if (checkResult.length === 0) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Delivery assignment not found"

                });

            }

            const assignment =
                checkResult[0];

            console.log(
                "📦 ASSIGNMENT FOUND =",
                assignment
            );

            // ==================================================
            // ONLY OUT FOR DELIVERY CAN BE DELIVERED
            // ==================================================

            if (
                assignment.status !==
                "OutForDelivery"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        `Cannot mark as delivered. Current status is ${assignment.status}`

                });

            }

            // ==================================================
            // STEP 4 :
            // UPDATE DELIVERY ASSIGNMENT
            // ==================================================

            const deliverSQL = `

                UPDATE delivery_assignments

                SET
                    status = 'Delivered',
                    delivered_at = NOW()

                WHERE id = ?

                AND delivery_boy_id = ?

                AND status = 'OutForDelivery'

            `;

            db.query(
                deliverSQL,
                [
                    assignmentId,
                    deliveryBoyId
                ],
                (deliverErr, deliverResult) => {

                    if (deliverErr) {

                        console.log(
                            "❌ DELIVER DELIVERY ERROR:",
                            deliverErr
                        );

                        return res.status(500).json({

                            success: false,

                            message:
                                "Failed to mark delivery as completed",

                            error:
                                deliverErr.sqlMessage ||
                                deliverErr.message

                        });

                    }

                    // ==================================================
                    // CHECK ASSIGNMENT UPDATE
                    // ==================================================

                    if (
                        deliverResult.affectedRows === 0
                    ) {

                        return res.status(400).json({

                            success: false,

                            message:
                                "Delivery status was not updated"

                        });

                    }

                    console.log(
                        "✅ ASSIGNMENT STATUS UPDATED"
                    );

                    console.log(
                        "Assignment ID =",
                        assignmentId
                    );

                    console.log(
                        "Status = Delivered"
                    );

                    // ==================================================
                    // STEP 5 :
                    // UPDATE ORDER STATUS
                    // ==================================================

                    const updateOrderSQL = `

                        UPDATE orders

                        SET
                            order_status = 'Completed'

                        WHERE id = ?

                    `;

                    db.query(
                        updateOrderSQL,
                        [
                            assignment.order_id
                        ],
                        (orderErr, orderResult) => {

                            if (orderErr) {

                                console.log(
                                    "❌ UPDATE ORDER STATUS ERROR:",
                                    orderErr
                                );

                                return res.status(500).json({

                                    success: false,

                                    message:
                                        "Delivery completed but order status update failed",

                                    error:
                                        orderErr.sqlMessage ||
                                        orderErr.message

                                });

                            }

                            // ==================================================
                            // CHECK ORDER UPDATE
                            // ==================================================

                            if (
                                orderResult.affectedRows === 0
                            ) {

                                return res.status(400).json({

                                    success: false,

                                    message:
                                        "Delivery marked as delivered but order status was not updated"

                                });

                            }

                            console.log(
                                "🎉 DELIVERY COMPLETED"
                            );

                            console.log(
                                "Assignment ID =",
                                assignmentId
                            );

                            console.log(
                                "Order ID =",
                                assignment.order_id
                            );

                            console.log(
                                "Delivery Boy ID =",
                                deliveryBoyId
                            );

                            console.log(
                                "Assignment Status = Delivered"
                            );

                            console.log(
                                "Order Status = Completed"
                            );

                            // ==================================================
                            // STEP 6 :
                            // AUTO ASSIGN NEXT WAITING DELIVERY
                            // ==================================================

                            console.log(
                                "🔄 DELIVERY COMPLETED → CHECKING WAITING ORDERS"
                            );

                            exports.autoAssignWaitingDelivery(
                                (waitingErr, waitingAssignment) => {

                                    // ==================================================
                                    // AUTO ASSIGN ERROR
                                    // ==================================================

                                    if (waitingErr) {

                                        console.log(
                                            "⚠️ WAITING ORDER AUTO ASSIGN FAILED:",
                                            waitingErr
                                        );

                                    }

                                    // ==================================================
                                    // NO WAITING ORDER / NO AVAILABLE BOY
                                    // ==================================================

                                    else if (
                                        !waitingAssignment
                                    ) {

                                        console.log(
                                            "ℹ️ NO WAITING ORDER OR NO DELIVERY BOY AVAILABLE"
                                        );

                                    }

                                    // ==================================================
                                    // WAITING ORDER ASSIGNED
                                    // ==================================================

                                    else {

                                        console.log(
                                            "✅ NEXT WAITING ORDER AUTOMATICALLY ASSIGNED"
                                        );

                                        console.log(
                                            "📦 Waiting Order ID =",
                                            waitingAssignment.orderId
                                        );

                                        console.log(
                                            "🚚 Delivery Boy ID =",
                                            waitingAssignment.deliveryBoyId
                                        );

                                        console.log(
                                            "👤 Delivery Boy Name =",
                                            waitingAssignment.deliveryBoyName
                                        );

                                    }

                                    // ==================================================
                                    // FINAL RESPONSE
                                    // ==================================================

                                    return res.json({

                                        success: true,

                                        message:
                                            "Order delivered successfully",

                                        assignmentId:
                                            Number(assignmentId),

                                        orderId:
                                            assignment.order_id,

                                        deliveryBoyId:
                                            deliveryBoyId,

                                        assignmentStatus:
                                            "Delivered",

                                        orderStatus:
                                            "Completed",

                                        waitingOrderAssigned:
                                            !!waitingAssignment,

                                        waitingAssignment:
                                            waitingAssignment || null

                                    });

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
// CANCEL DELIVERY
// ======================================================
//
// Delivered order cancel করা যাবে না.
//
// Assigned / Accepted / OutForDelivery
// → Cancelled
// ======================================================

exports.cancelDelivery = (req, res) => {

    console.log(
        "🔥 CANCEL DELIVERY ROUTE HIT"
    );


    const assignmentId =
        req.params.assignmentId;


    if (!assignmentId) {

        return res.status(400).json({

            success: false,

            message:
                "Assignment ID is required"

        });
    }


    const deliveryBoyId =
        req.user?.id ||
        req.user?.userId ||
        req.user?.staffId;


    if (!deliveryBoyId) {

        return res.status(401).json({

            success: false,

            message:
                "Delivery Boy ID not found in authentication token"

        });
    }


    // ==================================================
    // CHECK ASSIGNMENT
    // ==================================================

    const checkSQL = `

        SELECT
            id,
            order_id,
            delivery_boy_id,
            status

        FROM delivery_assignments

        WHERE id = ?

        AND delivery_boy_id = ?

    `;


    db.query(
        checkSQL,
        [
            assignmentId,
            deliveryBoyId
        ],
        (checkErr, checkResult) => {

            if (checkErr) {

                console.log(
                    "❌ CHECK CANCEL DELIVERY ERROR:",
                    checkErr
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "Database Error",

                    error:
                        checkErr.sqlMessage ||
                        checkErr.message

                });
            }


            if (
                checkResult.length === 0
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Delivery assignment not found"

                });
            }


            const assignment =
                checkResult[0];


            // ==================================================
            // PREVENT CANCELLING DELIVERED ORDER
            // ==================================================

            if (
                assignment.status ===
                "Delivered"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Delivered order cannot be cancelled"

                });
            }


            // ==================================================
            // PREVENT CANCELLING ALREADY CANCELLED
            // ==================================================

            if (
                assignment.status ===
                "Cancelled"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Delivery is already cancelled"

                });
            }


            // ==================================================
            // CANCEL ASSIGNMENT
            // ==================================================

            const cancelSQL = `

                UPDATE delivery_assignments

                SET
                    status =
                        'Cancelled'

                WHERE id = ?

                AND delivery_boy_id = ?

                AND status IN (
                    'Assigned',
                    'Accepted',
                    'OutForDelivery'
                )

            `;


            db.query(
                cancelSQL,
                [
                    assignmentId,
                    deliveryBoyId
                ],
                (cancelErr, cancelResult) => {

                    if (cancelErr) {

                        console.log(
                            "❌ CANCEL DELIVERY ERROR:",
                            cancelErr
                        );

                        return res.status(500).json({

                            success: false,

                            message:
                                "Failed to cancel delivery",

                            error:
                                cancelErr.sqlMessage ||
                                cancelErr.message

                        });
                    }


                    if (
                        cancelResult.affectedRows === 0
                    ) {

                        return res.status(400).json({

                            success: false,

                            message:
                                "Delivery could not be cancelled"

                        });
                    }


                    console.log(
                        "❌ DELIVERY CANCELLED"
                    );


                    return res.json({

                        success: true,

                        message:
                            "Delivery cancelled successfully",

                        assignmentId:
                            Number(assignmentId),

                        orderId:
                            assignment.order_id,

                        status:
                            "Cancelled"

                    });

                }
            );

        }
    );

};
// ==================================================
// STAFF / MANAGER AUTO ASSIGN WAITING DELIVERY
// ==================================================

exports.staffAutoAssignWaitingDelivery = (req, res) => {

    console.log(
        "🖥️ STAFF DASHBOARD → AUTO ASSIGN CHECK STARTED"
    );

    exports.autoAssignWaitingDelivery(
        (assignErr, assignment) => {

            if (assignErr) {

                console.error(
                    "❌ STAFF AUTO ASSIGN ERROR:",
                    assignErr
                );

                return res.status(500).json({
                    success: false,
                    message: "Auto assignment failed"
                });

            }

            if (assignment) {

                console.log(
                    "✅ STAFF DASHBOARD AUTO ASSIGNED DELIVERY:",
                    assignment
                );

                return res.json({
                    success: true,
                    waitingOrderAssigned: true,
                    assignment: assignment
                });

            }

            console.log(
                "ℹ️ STAFF AUTO ASSIGN: NO WAITING ORDER / NO AVAILABLE DELIVERY BOY"
            );

            return res.json({
                success: true,
                waitingOrderAssigned: false,
                assignment: null
            });

        }
    );

};
// ==========================================
// DELIVERY BOY HEARTBEAT
// ==========================================
// ==========================================
// DELIVERY BOY HEARTBEAT
// ==========================================
exports.deliveryBoyHeartbeat = (req, res) => {

    const deliveryBoyId = req.user.id;

    console.log("🔥 HEARTBEAT CODE VERSION 4");
    console.log("👤 ID =", deliveryBoyId);
    console.log("🖥️ LEAVE CHECK ENABLED");

    const sql = `
        UPDATE staff
        SET
            online_status = 'Online',
            last_seen = NOW()
        WHERE id = ?
        AND role = 'DeliveryBoy'
        AND status = 'Active'
        AND on_leave = 0
    `;

    db.query(sql, [deliveryBoyId], (err, result) => {

        if (err) {
            console.error(
                "❌ HEARTBEAT DB ERROR:",
                err
            );

            return res.status(500).json({
                success: false,
                message: "Heartbeat update failed"
            });
        }

        // Delivery Boy is on leave / unavailable
        if (result.affectedRows === 0) {

            return res.status(200).json({
                success: false,
                message:
                    "Heartbeat blocked because Delivery Boy is on leave",
                deliveryBoyId
            });
        }

        console.log(
            "💚 HEARTBEAT UPDATED:",
            deliveryBoyId
        );

        // ==========================================
        // 🔄 CHECK WAITING DELIVERY AFTER HEARTBEAT
        // ==========================================

        exports.autoAssignWaitingDelivery(
            (assignErr, assignment) => {

                if (assignErr) {

                    console.error(
                        "❌ AUTO ASSIGN AFTER HEARTBEAT ERROR:",
                        assignErr
                    );

                    return res.json({
                        success: true,
                        message: "Heartbeat received",
                        deliveryBoyId,
                        waitingOrderAssigned: false,
                        autoAssignError: true
                    });
                }

                // Waiting order successfully assigned
                if (assignment) {

                    console.log(
                        "🚚 WAITING ORDER AUTO ASSIGNED AFTER HEARTBEAT:",
                        assignment
                    );

                    return res.json({
                        success: true,
                        message: "Heartbeat received",
                        deliveryBoyId,
                        waitingOrderAssigned: true,
                        assignment
                    });
                }

                // No waiting order available
                console.log(
                    "ℹ️ NO WAITING DELIVERY TO ASSIGN"
                );

                return res.json({
                    success: true,
                    message: "Heartbeat received",
                    deliveryBoyId,
                    waitingOrderAssigned: false,
                    assignment: null
                });
            }
        );
    });
};
// ===============================
// DELIVERY BOY LEAVE
// ===============================

exports.setDeliveryBoyLeave = (req, res) => {

    const deliveryBoyId = req.user.id;
    const { on_leave } = req.body;

    // Validate
    if (on_leave !== 0 && on_leave !== 1) {
        return res.status(400).json({
            success: false,
            message: "on_leave must be 0 or 1"
        });
    }

    // ==========================================
    // LEAVE = 1  → Offline
    // RETURN = 0 → Online
    // ==========================================

    const sql = `
        UPDATE staff
        SET
            on_leave = ?,
            online_status = ?
        WHERE id = ?
        AND role = 'DeliveryBoy'
        AND status = 'Active'
    `;
const onlineStatus = "Offline";

    db.query(
        sql,
        [on_leave, onlineStatus, deliveryBoyId],
        (err, result) => {

            if (err) {
                console.error(
                    "❌ LEAVE UPDATE ERROR:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: "Leave update failed"
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: "Delivery Boy not found"
                });
            }

            console.log(
                "🏖️ DELIVERY BOY LEAVE UPDATED:",
                deliveryBoyId,
                "on_leave =",
                on_leave,
                "online_status =",
                onlineStatus
            );

            // ==========================================
            // 🔄 RETURN TO WORK
            // CHECK WAITING DELIVERY
            // ==========================================

            if (on_leave === 0) {

                console.log(
                    "🔙 DELIVERY BOY RETURNED TO WORK"
                );

                exports.autoAssignWaitingDelivery(
                    (assignErr, assignment) => {

                        if (assignErr) {

                            console.error(
                                "❌ AUTO ASSIGN AFTER RETURN ERROR:",
                                assignErr
                            );

                            return res.json({
                                success: true,
                                message:
                                    "Returned to work successfully",
                                deliveryBoyId,
                                on_leave,
                                online_status: onlineStatus,
                                waitingOrderAssigned: false,
                                autoAssignError: true
                            });
                        }

                        // Waiting order assigned
                        if (assignment) {

                            console.log(
                                "🚚 WAITING ORDER ASSIGNED AFTER RETURN:",
                                assignment
                            );

                            return res.json({
                                success: true,
                                message:
                                    "Returned to work successfully",
                                deliveryBoyId,
                                on_leave,
                                online_status: onlineStatus,
                                waitingOrderAssigned: true,
                                assignment
                            });
                        }

                        // No waiting order
                        console.log(
                            "ℹ️ NO WAITING DELIVERY AFTER RETURN"
                        );

                        return res.json({
                            success: true,
                            message:
                                "Returned to work successfully",
                            deliveryBoyId,
                            on_leave,
                            online_status: onlineStatus,
                            waitingOrderAssigned: false,
                            assignment: null
                        });
                    }
                );

                return;
            }

            // ==========================================
            // LEAVE APPLIED
            // ==========================================

            return res.json({
                success: true,
                message: "Leave applied successfully",
                deliveryBoyId,
                on_leave,
                online_status: onlineStatus
            });
        }
    );
};
// ======================================================
// SETTLE CUSTOMER CANCELLATION CASH
// DeliveryBoy physically cash দেওয়ার পরে এই API call করবে
// ======================================================

exports.settleCancellationCash = (req, res) => {

    console.log(
        "💵 SETTLE CANCELLATION CASH ROUTE HIT"
    );

    const deliveryBoyId =
        req.user?.id ||
        req.user?.userId ||
        req.user?.staffId;

    const customerId =
        req.body.customer_id;

    // ------------------------------------------
    // DELIVERY BOY LOGIN CHECK
    // ------------------------------------------

    if (!deliveryBoyId) {

        return res.status(401).json({
            success: false,
            message:
                "Delivery Boy authentication required"
        });

    }

    // ------------------------------------------
    // CUSTOMER ID CHECK
    // ------------------------------------------

    if (!customerId) {

        return res.status(400).json({
            success: false,
            message:
                "customer_id is required"
        });

    }

    // ------------------------------------------
    // FIRST CHECK CUSTOMER CASH
    // ------------------------------------------

    const checkSQL = `
        SELECT
            id,
            name,
            pending_cancellation_amount
        FROM customers
        WHERE id = ?
        LIMIT 1
    `;

    db.query(
        checkSQL,
        [customerId],
        (checkError, customerResult) => {

            if (checkError) {

                console.log(
                    "❌ CHECK CUSTOMER CASH ERROR:",
                    checkError
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Failed to check customer cash",
                    error:
                        checkError.sqlMessage ||
                        checkError.message
                });

            }

            if (
                customerResult.length === 0
            ) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Customer not found"
                });

            }

            const customer =
                customerResult[0];

            const pendingAmount =
                Number(
                    customer.pending_cancellation_amount
                ) || 0;

            // ------------------------------------------
            // NOTHING TO SETTLE
            // ------------------------------------------

            if (pendingAmount <= 0) {

                return res.status(400).json({
                    success: false,
                    message:
                        "No pending cancellation cash for this customer"
                });

            }

            // ------------------------------------------
            // CLEAR PENDING CASH
            // ------------------------------------------

            const updateSQL = `
                UPDATE customers
                SET pending_cancellation_amount = 0.00
                WHERE id = ?
            `;

            db.query(
                updateSQL,
                [customerId],
                (updateError, updateResult) => {

                    if (updateError) {

                        console.log(
                            "❌ SETTLE CASH UPDATE ERROR:",
                            updateError
                        );

                        return res.status(500).json({
                            success: false,
                            message:
                                "Failed to settle cancellation cash",
                            error:
                                updateError.sqlMessage ||
                                updateError.message
                        });

                    }

                    console.log(
                        "✅ CANCELLATION CASH SETTLED"
                    );

                    console.log(
                        "Customer ID =",
                        customerId
                    );

                    console.log(
                        "Amount Settled =",
                        pendingAmount
                    );

                    console.log(
                        "DeliveryBoy ID =",
                        deliveryBoyId
                    );

                    return res.json({

                        success: true,

                        message:
                            "Cancellation cash settled successfully",

                        customer_id:
                            Number(customerId),

                        amount_settled:
                            pendingAmount,

                        remaining_amount:
                            0

                    });

                }
            );

        }
    );

};
// ======================================================
// SETTLE CUSTOMER CASHBACK
// DeliveryBoy customer-কে cashback দেওয়ার পরে
// এই API call করবে
// ======================================================

exports.settleCashback = (req, res) => {

    console.log(
        "💰 SETTLE CASHBACK ROUTE HIT"
    );

    // ==================================================
    // STEP 1 : GET DELIVERY BOY ID FROM JWT
    // ==================================================

    const deliveryBoyId =
        req.user?.id ||
        req.user?.userId ||
        req.user?.staffId;

    const assignmentId =
        req.params.assignmentId;


    // ==================================================
    // DELIVERY BOY LOGIN CHECK
    // ==================================================

    if (!deliveryBoyId) {

        return res.status(401).json({

            success: false,

            message:
                "Delivery Boy authentication required"

        });

    }


    // ==================================================
    // ASSIGNMENT ID CHECK
    // ==================================================

    if (!assignmentId) {

        return res.status(400).json({

            success: false,

            message:
                "Assignment ID is required"

        });

    }


    // ==================================================
    // STEP 2 : CHECK DELIVERY ASSIGNMENT
    // ==================================================

    const checkSQL = `

        SELECT

            da.id AS assignment_id,

            da.order_id,

            da.delivery_boy_id,

            da.status AS delivery_status,

            o.cashback_amount,

            o.cashback_status,

            o.order_status

        FROM delivery_assignments da

        INNER JOIN orders o
            ON da.order_id = o.id

        WHERE da.id = ?

        AND da.delivery_boy_id = ?

        LIMIT 1

    `;


    db.query(
        checkSQL,
        [
            assignmentId,
            deliveryBoyId
        ],
        (checkError, result) => {

            if (checkError) {

                console.log(
                    "❌ CHECK CASHBACK ERROR:",
                    checkError
                );

                return res.status(500).json({

                    success: false,

                    message:
                        "Failed to check cashback",

                    error:
                        checkError.sqlMessage ||
                        checkError.message

                });

            }


            // ==================================================
            // ASSIGNMENT NOT FOUND
            // ==================================================

            if (
                result.length === 0
            ) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Delivery assignment not found"

                });

            }


            const order =
                result[0];


            const cashbackAmount =
                Number(
                    order.cashback_amount
                ) || 0;


            // ==================================================
            // NO CASHBACK
            // ==================================================

            if (
                cashbackAmount <= 0
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "This order has no cashback to give"

                });

            }


            // ==================================================
            // CASHBACK ALREADY PAID
            // ==================================================

            if (
                order.cashback_status ===
                "Paid"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Cashback has already been paid"

                });

            }


            // ==================================================
            // ONLY DELIVERED ORDER
            // CAN HAVE CASHBACK SETTLED
            // ==================================================

            if (
                order.delivery_status !==
                "Delivered"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Cashback can only be settled after delivery"

                });

            }


            // ==================================================
            // STEP 3 : MARK CASHBACK AS PAID
            // ==================================================

            const updateSQL = `

                UPDATE orders

                SET

                    cashback_status = 'Paid',

                    cashback_paid_by = ?,

                    cashback_paid_at = NOW()

                WHERE id = ?

                AND cashback_status = 'Pending'

            `;


            db.query(
                updateSQL,
                [
                    deliveryBoyId,
                    order.order_id
                ],
                (updateError, updateResult) => {

                    if (updateError) {

                        console.log(
                            "❌ CASHBACK SETTLEMENT UPDATE ERROR:",
                            updateError
                        );

                        return res.status(500).json({

                            success: false,

                            message:
                                "Failed to settle cashback",

                            error:
                                updateError.sqlMessage ||
                                updateError.message

                        });

                    }


                    // ==================================================
                    // PREVENT DOUBLE PAYMENT
                    // ==================================================

                    if (
                        updateResult.affectedRows === 0
                    ) {

                        return res.status(400).json({

                            success: false,

                            message:
                                "Cashback was already settled or could not be settled"

                        });

                    }


                    // ==================================================
                    // SUCCESS
                    // ==================================================

                    console.log(
                        "✅ CASHBACK SETTLED"
                    );

                    console.log(
                        "Assignment ID =",
                        assignmentId
                    );

                    console.log(
                        "Order ID =",
                        order.order_id
                    );

                    console.log(
                        "Cashback Amount =",
                        cashbackAmount
                    );

                    console.log(
                        "Delivery Boy ID =",
                        deliveryBoyId
                    );


                    return res.json({

                        success: true,

                        message:
                            "Cashback paid successfully",

                        assignmentId:
                            Number(
                                assignmentId
                            ),

                        orderId:
                            order.order_id,

                        cashbackAmount:
                            cashbackAmount,

                        cashbackStatus:
                            "Paid",

                        cashbackPaidBy:
                            deliveryBoyId

                    });

                }
            );

        }
    );

};