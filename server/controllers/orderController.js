const db = require("../config/db");
const {
    sendPushToDeliveryBoy,
    sendPushToManagers
} = require(
    "../services/deliveryPushService"
);

console.log("================================================");
console.log("✅ NEW ORDER CONTROLLER LOADED SUCCESSFULLY");
console.log("================================================");


// ======================================================
// HELPER: SHOP → CUSTOMER ROAD DISTANCE
// ======================================================

async function calculateDeliveryDistance(
    customerId,
    shopId
) {

    return new Promise(
        (resolve, reject) => {

            const sql = `
                SELECT

                    c.latitude
                        AS customer_latitude,

                    c.longitude
                        AS customer_longitude,

                    s.latitude
                        AS shop_latitude,

                    s.longitude
                        AS shop_longitude

                FROM customers c

                JOIN shop_settings s
                    ON s.id = ?

                WHERE c.id = ?

                LIMIT 1
            `;


            db.query(
                sql,
                [
                    shopId,
                    customerId
                ],
                async (
                    err,
                    rows
                ) => {

                    if (err) {

                        console.error(
                            "❌ DISTANCE DATABASE ERROR:",
                            err
                        );

                        return reject(err);
                    }


                    if (
                        !rows ||
                        rows.length === 0
                    ) {

                        return reject(
                            new Error(
                                "Customer or shop location not found"
                            )
                        );

                    }


                    const location =
                        rows[0];


                    const customerLat =
                        Number(
                            location.customer_latitude
                        );


                    const customerLng =
                        Number(
                            location.customer_longitude
                        );


                    const shopLat =
                        Number(
                            location.shop_latitude
                        );


                    const shopLng =
                        Number(
                            location.shop_longitude
                        );


                    // ==================================================
                    // VALIDATE COORDINATES
                    // ==================================================

                    if (

                        !Number.isFinite(
                            customerLat
                        ) ||

                        !Number.isFinite(
                            customerLng
                        ) ||

                        !Number.isFinite(
                            shopLat
                        ) ||

                        !Number.isFinite(
                            shopLng
                        )

                    ) {

                        return reject(
                            new Error(
                                "Invalid customer or shop coordinates"
                            )
                        );

                    }


                    console.log(
                        "📍 SHOP LOCATION =",
                        shopLat,
                        shopLng
                    );


                    console.log(
                        "📍 CUSTOMER LOCATION =",
                        customerLat,
                        customerLng
                    );


                    // ==================================================
                    // OSRM ROAD ROUTING
                    // ==================================================

                    const osrmUrl =

                        `https://router.project-osrm.org/route/v1/driving/` +

                        `${shopLng},${shopLat};` +

                        `${customerLng},${customerLat}` +

                        `?overview=false`;


                    console.log(
                        "🛣️ OSRM URL =",
                        osrmUrl
                    );


                    try {

                        const response =
                            await fetch(
                                osrmUrl
                            );


                        if (
                            !response.ok
                        ) {

                            throw new Error(
                                `OSRM returned HTTP ${response.status}`
                            );

                        }


                        const data =
                            await response.json();


                        if (

                            !data ||

                            data.code !==
                                "Ok" ||

                            !data.routes ||

                            data.routes.length === 0

                        ) {

                            throw new Error(
                                "OSRM route not found"
                            );

                        }


                        const distanceMeters =
                            Number(
                                data
                                    .routes[0]
                                    .distance
                            );


                        if (
                            !Number.isFinite(
                                distanceMeters
                            )
                        ) {

                            throw new Error(
                                "Invalid distance returned by OSRM"
                            );

                        }


                        const distanceKm =
                            Number(
                                (
                                    distanceMeters /
                                    1000
                                ).toFixed(2)
                            );


                        console.log(
                            "========================================"
                        );


                        console.log(
                            "🚚 DELIVERY DISTANCE CALCULATED"
                        );


                        console.log(
                            "Shop → Customer =",
                            distanceKm,
                            "KM"
                        );


                        console.log(
                            "========================================"
                        );


                        resolve({

                            distanceKm:

                                distanceKm,

                            distanceSource:

                                "OSRM"

                        });

                    }

                    catch (error) {

                        console.error(
                            "❌ OSRM DISTANCE ERROR:",
                            error
                        );


                        reject(
                            error
                        );

                    }

                }
            );

        }
    );

}



// ======================================================
// HELPER: GENERATE ORDER TOKEN
// ======================================================

function generateToken(
    callback
) {

    const now =
        new Date();


    const year =
        String(
            now.getFullYear()
        ).slice(-2);


    const month =
        String(
            now.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            now.getDate()
        ).padStart(
            2,
            "0"
        );


    const prefix =
        `T${year}${month}${day}`;


    const sql = `
        SELECT token_number

        FROM orders

        WHERE token_number LIKE ?

        ORDER BY id DESC

        LIMIT 1
    `;


    db.query(
        sql,
        [
            `${prefix}%`
        ],
        (
            err,
            rows
        ) => {

            if (err) {

                console.error(
                    "❌ TOKEN QUERY ERROR:",
                    err
                );


                return callback(
                    err
                );

            }


            let nextNumber =
                1;


            if (

                rows &&

                rows.length > 0 &&

                rows[0].token_number

            ) {

                const lastToken =
                    String(
                        rows[0]
                            .token_number
                    );


                const lastNumber =
                    parseInt(
                        lastToken.slice(-3),
                        10
                    );


                if (
                    Number.isFinite(
                        lastNumber
                    )
                ) {

                    nextNumber =
                        lastNumber + 1;

                }

            }


            const token =

                `${prefix}${String(
                    nextNumber
                ).padStart(
                    3,
                    "0"
                )}`;


            callback(
                null,
                token
            );

        }
    );

}



// ======================================================
// GET ALL ORDERS
// GET /api/orders
// ======================================================

exports.getOrders = (
    req,
    res
) => {

    console.log(
        "📦 GET ALL ORDERS API RUNNING"
    );


    const sql = `
        SELECT

            o.*,

            c.name
                AS customer_name,

            c.phone
                AS customer_phone,

            c.delivery_address,

            c.latitude
                AS customer_latitude,

            c.longitude
                AS customer_longitude,

            s.shop_name,

            s.phone
                AS shop_phone,

            s.latitude
                AS shop_latitude,

            s.longitude
                AS shop_longitude,
            da.id
                AS assignment_id,

            da.delivery_boy_id,

            da.status
                AS delivery_status,

            da.assigned_at,

            db.name
                AS delivery_boy_name
        FROM orders o

        LEFT JOIN customers c
            ON c.id = o.customer_id

        LEFT JOIN shop_settings s
            ON s.id = o.shop_id

        LEFT JOIN delivery_assignments da
            ON da.order_id = o.id

        LEFT JOIN staff db
            ON db.id = da.delivery_boy_id
        ORDER BY
            o.id DESC
    `;


    db.query(
        sql,
        (
            err,
            orders
        ) => {

            if (err) {

                console.error(
                    "❌ GET ORDERS DATABASE ERROR:",
                    err
                );


                return res.status(
                    500
                ).json({

                    success:
                        false,

                    message:
                        "Failed to load orders",

                    error:
                        err.message

                });

            }


            console.log(
                "📦 ORDERS FOUND =",
                orders.length
            );


            // ==================================================
            // LOAD ORDER ITEMS
            // ==================================================

            if (

                !orders ||

                orders.length === 0

            ) {

                return res.json(
                    []
                );

            }


            let completed =
                0;


            orders.forEach(
                (
                    order
                ) => {

                    const itemSql = `
                        SELECT

                            oi.*,

                           m.name AS name

                        FROM order_items oi

                        LEFT JOIN menu m
                            ON m.id =
                               oi.menu_id

                        WHERE oi.order_id = ?
                    `;


                    db.query(
                        itemSql,
                        [
                            order.id
                        ],
                        (
                            itemErr,
                            orderItems
                        ) => {

                            if (
                                itemErr
                            ) {

                                console.error(
                                    "❌ ORDER ITEMS ERROR:",
                                    itemErr
                                );


                                order.items =
                                    [];

                            }

                            else {

                                order.items =
                                    orderItems ||
                                    [];

                            }


                            completed++;


                            if (
                                completed ===
                                orders.length
                            ) {

                                return res.json(
                                    orders
                                );

                            }

                        }
                    );

                }
            );

        }
    );

};
// ======================================================
// CREATE ORDER
// POST /api/orders
// ======================================================

exports.createOrder = async (
    req,
    res
) => {

    console.log("");
    console.log(
        "================================================"
    );
    console.log(
        "🔥 CREATE ORDER API RUNNING"
    );
    console.log(
        "================================================"
    );


    try {

        // ==================================================
        // 1. FRONTEND REQUEST BODY
        // ==================================================

        console.log(
            "📦 REQUEST BODY =",
            req.body
        );


        const {

            customer_id,
            customerId,

            shop_id,

            order_type,
            orderType,

            table_number,
            tableNumber,

            total_amount,
            total,

            items,

            delivery_address,

            delivery_fee,

            delivery_landmark,

            special_instruction

        } = req.body;


        // ==================================================
        // 2. CUSTOMER ID
        // ==================================================

        const actualCustomerId =
            Number(
                customer_id ??
                customerId
            );


        console.log(
            "👤 CUSTOMER ID =",
            actualCustomerId
        );


        if (
            !Number.isInteger(
                actualCustomerId
            ) ||
            actualCustomerId <= 0
        ) {

            return res.status(
                400
            ).json({

                success: false,

                message:
                    "Valid customer ID is required"

            });

        }


        // ==================================================
        // 3. SHOP ID
        // ==================================================

        const actualShopId =
            Number(
                shop_id ?? 1
            );


        console.log(
            "🏪 SHOP ID =",
            actualShopId
        );


        if (
            !Number.isInteger(
                actualShopId
            ) ||
            actualShopId <= 0
        ) {

            return res.status(
                400
            ).json({

                success: false,

                message:
                    "Invalid shop ID"

            });

        }


        // ==================================================
        // 4. ORDER TYPE
        // ==================================================

        const actualOrderType =
            order_type ??
            orderType ??
            "Dine-In";


        console.log(
            "🛒 ORDER TYPE =",
            actualOrderType
        );


        const allowedOrderTypes = [

            "Dine-In",
            "Delivery",
            "Takeaway",
            "Manual"

        ];


        if (
            !allowedOrderTypes.includes(
                actualOrderType
            )
        ) {

            return res.status(
                400
            ).json({

                success: false,

                message:
                    "Invalid order type"

            });

        }


        // ==================================================
        // 5. TABLE NUMBER
        // ==================================================

        const actualTableNumber =
            table_number ??
            tableNumber ??
            null;


        console.log(
            "🪑 TABLE NUMBER =",
            actualTableNumber
        );


        // ==================================================
        // 6. TOTAL
        // ==================================================

        const actualTotal =
            Number(
                total_amount ??
                total ??
                0
            );


        console.log(
            "💰 TOTAL =",
            actualTotal
        );


        if (
            !Number.isFinite(
                actualTotal
            ) ||
            actualTotal < 0
        ) {

            return res.status(
                400
            ).json({

                success: false,

                message:
                    "Invalid order total"

            });

        }


        // ==================================================
        // 7. ITEMS
        // ==================================================

        if (
            !Array.isArray(items) ||
            items.length === 0
        ) {

            return res.status(
                400
            ).json({

                success: false,

                message:
                    "Order items are required"

            });

        }


        console.log(
            "🍽️ TOTAL ITEM TYPES =",
            items.length
        );


        // ==================================================
        // 8. DELIVERY VALIDATION
        // ==================================================

        if (
            actualOrderType === "Delivery"
        ) {

            if (
                !delivery_address ||
                !String(
                    delivery_address
                ).trim()
            ) {

                return res.status(
                    400
                ).json({

                    success: false,

                    message:
                        "Delivery address is required"

                });

            }


            console.log(
                "📍 DELIVERY ADDRESS =",
                delivery_address
            );


            console.log(
                "📍 DELIVERY LANDMARK =",
                delivery_landmark ||
                "Not provided"
            );

        }


        // ==================================================
        // 9. DISTANCE VARIABLES
        // ==================================================
let distanceKm = null;

let distanceSource = null;


        // ==================================================
        // 11. TOKEN GENERATION
        // ==================================================

        const token =
            await new Promise(
                (
                    resolve,
                    reject
                ) => {

                    generateToken(
                        (
                            err,
                            generatedToken
                        ) => {

                            if (err) {

                                return reject(
                                    err
                                );

                            }


                            resolve(
                                generatedToken
                            );

                        }
                    );

                }
            );


        console.log(
            "🎫 GENERATED TOKEN =",
            token
        );


        // ==================================================
        // 12. INITIAL ORDER STATUS
        // ==================================================

        const initialOrderStatus =
            "Pending";


        const paymentStatus =
            "Pending";


        // ==================================================
        // 13. ORDERS TABLE INSERT
        // ==================================================

        console.log(
            "📝 INSERTING INTO ORDERS TABLE..."
        );
const actualPaymentMethod =
    req.body.payment_method ??
    req.body.paymentMethod ??
    null;

        const orderSql = `

            INSERT INTO orders
            (
                customer_id,
                shop_id,
                order_type,
                table_number,
                delivery_address,
                delivery_fee,
                delivery_landmark,
                special_instruction,
                total_amount,
                order_status,
                payment_status,
                payment_method,
                token_number,
                distance_km,
                distance_source
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


        const orderValues = [

            actualCustomerId,

            actualShopId,

            actualOrderType,

            actualTableNumber,

            actualOrderType ===
                "Delivery"

                ? String(
                    delivery_address
                ).trim()

                : null,

            Number(
                delivery_fee
            ) || 0,

            actualOrderType ===
                "Delivery"

                ? (
                    delivery_landmark
                        ? String(
                            delivery_landmark
                        ).trim()
                        : null
                )

                : null,

            special_instruction
                ? String(
                    special_instruction
                ).trim()
                : null,

            actualTotal,

            initialOrderStatus,

            paymentStatus,
actualPaymentMethod,
            token,

            distanceKm,

            distanceSource

        ];


        console.log(
            "📝 ORDER VALUES =",
            orderValues
        );


        const orderResult =
            await new Promise(
                (
                    resolve,
                    reject
                ) => {

                    db.query(
                        orderSql,
                        orderValues,
                        (
                            err,
                            result
                        ) => {

                            if (err) {

                                console.error(
                                    "❌ ORDERS INSERT ERROR:",
                                    err
                                );


                                return reject(
                                    err
                                );

                            }


                            resolve(
                                result
                            );

                        }
                    );

                }
            );


        // ==================================================
        // 14. CHECK ORDER INSERT
        // ==================================================

        if (
            !orderResult ||
            !orderResult.insertId
        ) {

            throw new Error(
                "Order could not be created"
            );

        }


        const orderId =
            Number(
                orderResult.insertId
            );


        console.log("");
        console.log(
            "=============================================="
        );

        console.log(
            "✅ ORDER CREATED SUCCESSFULLY"
        );

        console.log(
            "🆔 ORDER ID =",
            orderId
        );

        console.log(
            "🎫 TOKEN =",
            token
        );

        console.log(
            "📏 DISTANCE =",
            distanceKm
        );

        console.log(
            "🗺️ DISTANCE SOURCE =",
            distanceSource
        );

        console.log(
            "=============================================="
        );


        // ==================================================
        // PART 3 CONTINUES HERE
        // ==================================================
                // ==================================================
        // PART 3
        // ORDER ITEMS + INVENTORY PROCESSING
        // ==================================================


        console.log("");
        console.log(
            "================================================"
        );

        console.log(
            "🍽️ STARTING ORDER ITEMS PROCESSING"
        );

        console.log(
            "================================================"
        );


        // ==================================================
        // 15. NORMALIZE ITEMS
        // ==================================================

        const normalizedItems =
            items.map(
                (item) => {

                    const menuId =
                        Number(
                            item.menu_id ??
                            item.menuId ??
                            item.id
                        );


                    const quantity =
                        Number(
                            item.quantity ??
                            item.qty ??
                            1
                        );


                    const price =
                        Number(
                            item.price ??
                            item.unit_price ??
                            item.unitPrice ??
                            0
                        );


                    return {

                        menuId:
                            menuId,

                        quantity:
                            quantity,

                        price:
                            price

                    };

                }
            );


        console.log(
            "🍽️ NORMALIZED ITEMS =",
            normalizedItems
        );


        // ==================================================
        // 16. VALIDATE NORMALIZED ITEMS
        // ==================================================

        for (
            const item
            of normalizedItems
        ) {


            if (
                !Number.isInteger(
                    item.menuId
                ) ||
                item.menuId <= 0
            ) {

                throw new Error(
                    "Invalid menu item ID"
                );

            }


            if (
                !Number.isFinite(
                    item.quantity
                ) ||
                item.quantity <= 0
            ) {

                throw new Error(
                    `Invalid quantity for menu item ${item.menuId}`
                );

            }


            if (
                !Number.isFinite(
                    item.price
                ) ||
                item.price < 0
            ) {

                throw new Error(
                    `Invalid price for menu item ${item.menuId}`
                );

            }

        }


        // ==================================================
        // 17. PROCESS EVERY ORDER ITEM
        // ==================================================

        for (
            const item
            of normalizedItems
        ) {


            console.log("");
            console.log(
                "----------------------------------------------"
            );


            console.log(
                "🍽️ PROCESSING MENU ID =",
                item.menuId
            );


            console.log(
                "🔢 ORDER QUANTITY =",
                item.quantity
            );


            // ==================================================
            // 18. GET MENU + INVENTORY
            // ==================================================

            const menuSql = `

                SELECT

                    m.*,

                    i.current_stock,

                    i.stock_quantity,

                    i.online_sold,

                    i.offline_sold

                FROM menu m

                LEFT JOIN inventory i
                    ON i.menu_id = m.id

                WHERE m.id = ?

                LIMIT 1

            `;


            const menuRows =
                await new Promise(
                    (
                        resolve,
                        reject
                    ) => {

                        db.query(
                            menuSql,
                            [
                                item.menuId
                            ],
                            (
                                err,
                                results
                            ) => {

                                if (err) {

                                    console.error(
                                        "❌ MENU + INVENTORY QUERY ERROR:",
                                        err
                                    );


                                    return reject(
                                        err
                                    );

                                }


                                resolve(
                                    results
                                );

                            }
                        );

                    }
                );


            // ==================================================
            // 19. MENU ITEM CHECK
            // ==================================================

            if (
                !menuRows ||
                menuRows.length === 0
            ) {

                throw new Error(
                    `Menu item ${item.menuId} not found`
                );

            }


            const menuItem =
                menuRows[0];


            console.log(
                "🍴 MENU NAME =",
                menuItem.name ||
                menuItem.item_name ||
                "Unknown"
            );


            // ==================================================
            // 20. INVENTORY CHECK
            // ==================================================

            if (
                menuItem.current_stock ===
                    null ||

                menuItem.current_stock ===
                    undefined
            ) {

                console.error(
                    "❌ INVENTORY NOT FOUND"
                );


                console.error(
                    "🍽️ MENU ID =",
                    item.menuId
                );


                throw new Error(
                    `Inventory not found for menu item ${item.menuId}`
                );

            }


            // ==================================================
            // 21. CURRENT STOCK
            // ==================================================

            const currentStock =
                Number(
                    menuItem.current_stock
                );


            const stockQuantity =
                Number(
                    menuItem.stock_quantity
                );


            console.log(
                "📦 CURRENT STOCK =",
                currentStock
            );


            console.log(
                "📦 STOCK QUANTITY =",
                stockQuantity
            );


            // ==================================================
            // 22. VALIDATE STOCK VALUES
            // ==================================================

            if (
                !Number.isFinite(
                    currentStock
                ) ||
                currentStock < 0
            ) {

                throw new Error(
                    `Invalid current stock for menu item ${item.menuId}`
                );

            }


            if (
                !Number.isFinite(
                    stockQuantity
                ) ||
                stockQuantity < 0
            ) {

                throw new Error(
                    `Invalid stock quantity for menu item ${item.menuId}`
                );

            }


            // ==================================================
            // 23. CHECK AVAILABLE STOCK
            // ==================================================

            if (
                currentStock <
                item.quantity
            ) {

                console.error(
                    "❌ INSUFFICIENT STOCK"
                );


                console.error(
                    "🍽️ MENU ID =",
                    item.menuId
                );


                console.error(
                    "🍴 MENU NAME =",
                    menuItem.name ||
                    menuItem.item_name
                );


                console.error(
                    "📦 AVAILABLE =",
                    currentStock
                );


                console.error(
                    "🔢 REQUIRED =",
                    item.quantity
                );


                throw new Error(
                    `Insufficient stock for menu item ${item.menuId}`
                );

            }


            // ==================================================
            // 24. CHECK MENU AVAILABILITY
            // ==================================================

            if (
                menuItem.available !==
                    undefined &&

                menuItem.available !==
                    null &&

                Number(
                    menuItem.available
                ) === 0
            ) {

                console.error(
                    "❌ MENU ITEM NOT AVAILABLE"
                );


                throw new Error(
                    `Menu item ${item.menuId} is currently unavailable`
                );

            }


            // ==================================================
            // 25. INSERT ORDER ITEM
            // ==================================================

      // ==================================================
// INSERT ORDER ITEM
// ==================================================

const itemSql = `
    INSERT INTO order_items
    (
        order_id,
        menu_id,
        quantity,
        price,
        subtotal
    )
    VALUES
    (
        ?,
        ?,
        ?,
        ?,
        ?
    )
`;

await new Promise(
    (
        resolve,
        reject
    ) => {

       db.query(
    itemSql,
    [
        orderId,
        item.menuId,
        item.quantity,
        item.price,
        Number(item.price) *
        Number(item.quantity)
    ],
    (
        err,
        result
    ) => {

        if (err) {

                    console.error(
                        "❌ ORDER ITEM INSERT ERROR:",
                        err
                    );

                    return reject(err);

                }

                console.log(
                    "✅ ORDER ITEM INSERTED"
                );

                console.log(
                    "🆔 ORDER ID =",
                    orderId
                );

                console.log(
                    "🍽️ MENU ID =",
                    item.menuId
                );

                console.log(
                    "🔢 QUANTITY =",
                    item.quantity
                );

                console.log(
                    "💰 PRICE =",
                    item.price
                );

                console.log(
                    "🧮 SUBTOTAL =",
                    Number(item.price) *
                    Number(item.quantity)
                );

                resolve(result);

            }
        );

    }
);


            // ==================================================
            // 26. SOLD COLUMN
            // ==================================================

            const soldColumn =

                actualOrderType ===
                    "Manual"

                    ? "offline_sold"

                    : "online_sold";


            console.log(
                "📈 SOLD COLUMN =",
                soldColumn
            );


            // ==================================================
            // 27. DEDUCT INVENTORY
            // ==================================================
            //
            // IMPORTANT:
            //
            // menu table-এ stock update হবে না।
            //
            // inventory table-এই:
            //
            // current_stock
            // stock_quantity
            // online_sold / offline_sold
            //
            // update হবে।
            // ==================================================

            const inventoryUpdateSql = `

                UPDATE inventory

                SET

                    current_stock =
                        current_stock - ?,

                    stock_quantity =
                        stock_quantity - ?,

                    ${soldColumn} =
                        COALESCE(
                            ${soldColumn},
                            0
                        ) + ?

                WHERE

                    menu_id = ?

                    AND current_stock >= ?

                    AND stock_quantity >= ?

            `;


            const inventoryResult =
                await new Promise(
                    (
                        resolve,
                        reject
                    ) => {

                        db.query(
                            inventoryUpdateSql,
                            [

                                item.quantity,

                                item.quantity,

                                item.quantity,

                                item.menuId,

                                item.quantity,

                                item.quantity

                            ],
                            (
                                err,
                                result
                            ) => {

                                if (err) {

                                    console.error(
                                        "❌ INVENTORY UPDATE ERROR:",
                                        err
                                    );


                                    return reject(
                                        err
                                    );

                                }


                                resolve(
                                    result
                                );

                            }
                        );

                    }
                );


            // ==================================================
            // 28. VERIFY INVENTORY UPDATE
            // ==================================================

            if (
                !inventoryResult ||
                inventoryResult.affectedRows === 0
            ) {

                console.error(
                    "❌ INVENTORY UPDATE FAILED"
                );


                console.error(
                    "🍽️ MENU ID =",
                    item.menuId
                );


                console.error(
                    "🔢 QUANTITY =",
                    item.quantity
                );


                throw new Error(
                    `Stock became insufficient while processing menu item ${item.menuId}`
                );

            }


            console.log(
                "✅ INVENTORY DEDUCTION SUCCESS"
            );


            console.log(
                "🍽️ MENU ID =",
                item.menuId
            );


            console.log(
                "📦 DEDUCTED QUANTITY =",
                item.quantity
            );


            // ==================================================
            // 29. READ UPDATED INVENTORY
            // ==================================================

            const updatedInventorySql = `

                SELECT

                    menu_id,

                    current_stock,

                    stock_quantity,

                    online_sold,

                    offline_sold

                FROM inventory

                WHERE menu_id = ?

                LIMIT 1

            `;


            const updatedInventory =
                await new Promise(
                    (
                        resolve,
                        reject
                    ) => {

                        db.query(
                            updatedInventorySql,
                            [
                                item.menuId
                            ],
                            (
                                err,
                                results
                            ) => {

                                if (err) {

                                    return reject(
                                        err
                                    );

                                }


                                resolve(
                                    results
                                );

                            }
                        );

                    }
                );


            if (
                updatedInventory &&
                updatedInventory.length > 0
            ) {

                console.log(
                    "📦 UPDATED INVENTORY =",
                    updatedInventory[0]
                );

            }


            console.log(
                "✅ ITEM PROCESSING COMPLETE"
            );


        }


        // ==================================================
        // 30. ALL ITEMS COMPLETE
        // ==================================================

        console.log("");
        console.log(
            "================================================"
        );

        console.log(
            "✅ ALL ORDER ITEMS PROCESSED SUCCESSFULLY"
        );

        console.log(
            "🆔 ORDER ID =",
            orderId
        );

        console.log(
            "🍽️ ITEM TYPES =",
            normalizedItems.length
        );

        console.log(
            "================================================"
        );
// ==================================================
// 30. CASHBACK CALCULATION
// ==================================================

console.log("");
console.log(
    "================================================"
);

console.log(
    "💰 STARTING CASHBACK CALCULATION"
);

console.log(
    "🆔 ORDER ID =",
    orderId
);


// ==================================================
// 30.1 GET FOOD TOTAL FROM ORDER ITEMS
// ==================================================

const foodTotalSql = `
    SELECT
        COALESCE(
            SUM(subtotal),
            0
        ) AS food_total
    FROM order_items
    WHERE order_id = ?
`;


const foodTotalRows =
    await new Promise(
        (
            resolve,
            reject
        ) => {

            db.query(
                foodTotalSql,
                [
                    orderId
                ],
                (
                    err,
                    results
                ) => {

                    if (err) {

                        console.error(
                            "❌ FOOD TOTAL QUERY ERROR:",
                            err
                        );

                        return reject(err);

                    }


                    resolve(
                        results
                    );

                }
            );

        }
    );


if (
    !foodTotalRows ||
    foodTotalRows.length === 0
) {

    throw new Error(
        "Food total could not be calculated"
    );

}


const foodTotal =
    Number(
        foodTotalRows[0].food_total || 0
    );


console.log(
    "🍽️ FOOD TOTAL =",
    foodTotal
);


// ==================================================
// 30.2 CALCULATE CASHBACK
// ==================================================

let cashbackAmount = 0;


if (
    foodTotal >= 2000
) {

    cashbackAmount = 1000;

}
else if (
    foodTotal >= 1500
) {

    cashbackAmount = 500;

}
else if (
    foodTotal >= 1100
) {

    cashbackAmount = 399;

}
else if (
    foodTotal >= 900
) {

    cashbackAmount = 300;

}
else if (
    foodTotal >= 850
) {

    cashbackAmount = 235;

}
else if (
    foodTotal >= 700
) {

    cashbackAmount = 200;

}
else if (
    foodTotal >= 650
) {

    cashbackAmount = 120;

}
else if (
    foodTotal >= 500
) {

    cashbackAmount = 100;

}
else if (
    foodTotal >= 400
) {

    cashbackAmount = 57;

}
else if (
    foodTotal >= 300
) {

    cashbackAmount = 50;

}
else if (
    foodTotal >= 250
) {

    cashbackAmount = 29;

}
else if (
    foodTotal >= 200
) {

    cashbackAmount = 23;

}
else {

    cashbackAmount = 0;

}


console.log(
    "🎁 CASHBACK AMOUNT =",
    cashbackAmount
);


// ==================================================
// 30.3 SAVE CASHBACK IN ORDERS TABLE
// ==================================================

const cashbackUpdateSql = `
    UPDATE orders
    SET cashback_amount = ?
    WHERE id = ?
`;


await new Promise(
    (
        resolve,
        reject
    ) => {

        db.query(
            cashbackUpdateSql,
            [
                cashbackAmount,
                orderId
            ],
            (
                err,
                result
            ) => {

                if (err) {

                    console.error(
                        "❌ CASHBACK UPDATE ERROR:",
                        err
                    );

                    return reject(err);

                }


                if (
                    !result ||
                    result.affectedRows === 0
                ) {

                    return reject(
                        new Error(
                            "Cashback could not be saved"
                        )
                    );

                }


                console.log(
                    "✅ CASHBACK SAVED SUCCESSFULLY"
                );

                console.log(
                    "🆔 ORDER ID =",
                    orderId
                );

                console.log(
                    "🍽️ FOOD TOTAL =",
                    foodTotal
                );

                console.log(
                    "🎁 CASHBACK =",
                    cashbackAmount
                );


                resolve(
                    result
                );

            }
        );

    }
);


// ==================================================
// 30.4 CASHBACK CALCULATION COMPLETE
// ==================================================

console.log(
    "✅ CASHBACK CALCULATION COMPLETED"
);

console.log(
    "================================================"
);

        // ==================================================
        // PART 4 CONTINUES HERE
        // ==================================================
                // ==================================================
        // PART 4
        // DELIVERYBOY AUTO ASSIGNMENT
        // + FINAL SUCCESS RESPONSE
        // + FINAL ERROR HANDLER
        // ==================================================


        // ==================================================
        // 31. DELIVERY ASSIGNMENT VARIABLES
        // ==================================================

        let deliveryAssigned =
            false;


        let assignmentId =
            null;


        let assignedDeliveryBoyId =
            null;


        // ==================================================
        // 32. CHECK DELIVERY ORDER
        // ==================================================

        if (
            actualOrderType ===
            "Delivery"
        ) {

            console.log("");
            console.log(
                "================================================"
            );

            console.log(
                "🚚 DELIVERY ORDER DETECTED"
            );

            console.log(
                "🤖 STARTING DELIVERYBOY AUTO ASSIGNMENT"
            );

            console.log(
                "================================================"
            );


            // ==================================================
            // 33. FIND AVAILABLE DELIVERYBOY
            // ==================================================
            //
            // Conditions:
            //
            // role = DeliveryBoy
            // online_status = Online
            // on_leave = 0
            //
            // এবং তার কোনো active delivery থাকবে না।
            //
            // Active statuses:
            //
            // Assigned
            // Accepted
            // OutForDelivery
            //
            // ==================================================

            const deliveryBoySql = `

                SELECT

                    s.id,

                    s.name,

                    s.phone,

                    s.online_status,

                    s.on_leave

                FROM staff s

                WHERE

                    s.role = 'DeliveryBoy'

                    AND s.online_status = 'Online'

                    AND s.on_leave = 0

                    AND NOT EXISTS
                    (

                        SELECT 1

                        FROM delivery_assignments da

                        WHERE

                            da.delivery_boy_id = s.id

                            AND da.status IN
                            (
                                'Assigned',
                                'Accepted',
                                'OutForDelivery'
                            )

                    )

                ORDER BY
                    s.id ASC

                LIMIT 1

            `;


            const deliveryBoyRows =
                await new Promise(
                    (
                        resolve,
                        reject
                    ) => {

                        db.query(
                            deliveryBoySql,
                            (
                                err,
                                results
                            ) => {

                                if (err) {

                                    console.error(
                                        "❌ DELIVERYBOY SEARCH ERROR:",
                                        err
                                    );


                                    return reject(
                                        err
                                    );

                                }


                                resolve(
                                    results
                                );

                            }
                        );

                    }
                );


            // ==================================================
            // 34. DELIVERYBOY FOUND
            // ==================================================

            if (

                deliveryBoyRows &&

                deliveryBoyRows.length > 0

            ) {

                const deliveryBoy =
                    deliveryBoyRows[0];


                assignedDeliveryBoyId =
                    Number(
                        deliveryBoy.id
                    );


                console.log(
                    "✅ AVAILABLE DELIVERYBOY FOUND"
                );


                console.log(
                    "👤 DELIVERYBOY ID =",
                    assignedDeliveryBoyId
                );


                console.log(
                    "👤 DELIVERYBOY NAME =",
                    deliveryBoy.name
                );


                console.log(
                    "📱 DELIVERYBOY PHONE =",
                    deliveryBoy.phone
                );


                // ==================================================
                // 35. CREATE DELIVERY ASSIGNMENT
                // ==================================================

                const assignmentSql = `

                    INSERT INTO delivery_assignments
                    (
                        order_id,
                        delivery_boy_id,
                        status,
                        assigned_at
                    )

                    VALUES
                    (
                        ?,
                        ?,
                        'Assigned',
                        NOW()
                    )

                `;


                const assignmentResult =
                    await new Promise(
                        (
                            resolve,
                            reject
                        ) => {

                            db.query(
                                assignmentSql,
                                [

                                    orderId,

                                    assignedDeliveryBoyId

                                ],
                                (
                                    err,
                                    result
                                ) => {

                                    if (err) {

                                        console.error(
                                            "❌ DELIVERY ASSIGNMENT INSERT ERROR:",
                                            err
                                        );


                                        return reject(
                                            err
                                        );

                                    }


                                    resolve(
                                        result
                                    );

                                }
                            );

                        }
                    );


                // ==================================================
                // 36. VERIFY ASSIGNMENT
                // ==================================================

                if (

                    assignmentResult &&

                    assignmentResult.insertId

                ) {

                    assignmentId =
                        Number(
                            assignmentResult
                                .insertId
                        );


                    deliveryAssigned =
                        true;
// ==================================================
// 🚚 CREATE FIRST DELIVERY ASSIGNMENT ATTEMPT
// ==================================================

try {

    const attemptResult =
        await new Promise(
            (resolve, reject) => {

                const attemptSql = `
                    INSERT INTO delivery_assignment_attempts
                    (
                        order_id,
                        delivery_boy_id,
                        attempt_no,
                        assigned_at,
                        status
                    )
                    VALUES
                    (
                        ?,
                        ?,
                        1,
                        NOW(),
                        'Assigned'
                    )
                `;

                db.query(
                    attemptSql,
                    [
                        orderId,
                        assignedDeliveryBoyId
                    ],
                    (
                        err,
                        result
                    ) => {

                        if (err) {

                            return reject(err);

                        }

                        resolve(result);

                    }
                );

            }
        );


    console.log(
        "✅ DELIVERY ATTEMPT CREATED"
    );

    console.log(
        "🆔 ATTEMPT ID =",
        attemptResult.insertId
    );

    console.log(
        "🔢 ATTEMPT NO = 1"
    );


    // ==================================================
    // 🔔 IMMEDIATE PUSH TO ASSIGNED DELIVERY BOY
    // ==================================================

    const pushResult =
        await sendPushToDeliveryBoy(

            assignedDeliveryBoyId,

            {

                orderId:
                    orderId,

                assignmentId:
                    assignmentId,

                attemptNo:
                    1,

                title:
                    "🚚 New Delivery Order",

                body:
                    `Order #${orderId} has been assigned to you.`,

                tag:
                    `delivery-order-${orderId}-attempt-1`,

                url:
                    "/staff-dashboard"

            }

        );


    console.log(
        "📨 IMMEDIATE DELIVERY PUSH RESULT =",
        pushResult
    );
// ==================================================
// 🔔 MANAGER DELIVERY ORDER PUSH
// ==================================================



}

catch (pushError) {

    console.error(
        "⚠️ DELIVERY PUSH / ATTEMPT ERROR:",
        pushError
    );

    // IMPORTANT:
    // Push failure should NOT cancel the customer order.

}

                    console.log("");
                    console.log(
                        "✅ DELIVERY ASSIGNMENT CREATED"
                    );


                    console.log(
                        "🆔 ASSIGNMENT ID =",
                        assignmentId
                    );


                    console.log(
                        "🆔 ORDER ID =",
                        orderId
                    );


                    console.log(
                        "👤 DELIVERYBOY ID =",
                        assignedDeliveryBoyId
                    );


                    console.log(
                        "📌 STATUS = Assigned"
                    );

                }

            }


            // ==================================================
            // 37. NO DELIVERYBOY AVAILABLE
            // ==================================================

            else {

                console.log("");
                console.log(
                    "⚠️ NO AVAILABLE DELIVERYBOY FOUND"
                );


                console.log(
                    "ℹ️ ORDER WILL REMAIN WITHOUT ASSIGNMENT"
                );


                console.log(
                    "ℹ️ MANAGER CAN ASSIGN LATER"
                );

            }
// ==================================================
// 🔔 MANAGER DELIVERY ORDER PUSH
// ==================================================

try {

    const managerPushResult =
        await sendPushToManagers({

            orderId:
                orderId,

            title:
                "🚚 New Delivery Order",

            body:
                `Delivery Order #${orderId} has been received.`,

            tag:
                `manager-delivery-order-${orderId}`,

            url:
                "/staff-dashboard"

        });

    console.log(
        "📨 MANAGER DELIVERY PUSH RESULT =",
        managerPushResult
    );

}
catch (managerPushError) {

    console.error(
        "⚠️ MANAGER DELIVERY PUSH ERROR:",
        managerPushError
    );

    // Manager push failure should
    // NOT cancel the customer order.

}
}


        // ==================================================
        // 38. NON-DELIVERY ORDER
        // ==================================================

        else {

            console.log(
                "ℹ️ DELIVERYBOY ASSIGNMENT NOT REQUIRED"
            );

        }


        // ==================================================
        // 39. FINAL ORDER DEBUG
        // ==================================================

        console.log("");
        console.log(
            "================================================"
        );

        console.log(
            "🎉 ORDER CREATION COMPLETED"
        );

        console.log(
            "================================================"
        );


        console.log(
            "🆔 ORDER ID =",
            orderId
        );


        console.log(
            "🎫 TOKEN =",
            token
        );


        console.log(
            "🛒 ORDER TYPE =",
            actualOrderType
        );


        console.log(
            "💰 TOTAL =",
            actualTotal
        );


        console.log(
            "📏 DISTANCE KM =",
            distanceKm
        );


        console.log(
            "🗺️ DISTANCE SOURCE =",
            distanceSource
        );


        console.log(
            "🚚 DELIVERY ASSIGNED =",
            deliveryAssigned
        );


        console.log(
            "👤 DELIVERYBOY ID =",
            assignedDeliveryBoyId
        );


        console.log(
            "🆔 ASSIGNMENT ID =",
            assignmentId
        );


        console.log(
            "================================================"
        );


        // ==================================================
        // 40. FINAL SUCCESS RESPONSE
        // ==================================================

        return res.status(
            201
        ).json({

            success:
                true,

            message:
                "Order created successfully",

            order_id:
                orderId,

            tokenNumber:
                token,

            orderType:
                actualOrderType,

            total:
                actualTotal,
cashbackAmount:
    cashbackAmount,
            distanceKm:
                distanceKm,

            distanceSource:
                distanceSource,

            deliveryAssigned:
                deliveryAssigned,

            deliveryBoyId:
                assignedDeliveryBoyId,

            assignmentId:
                assignmentId

        });


    // ========================================================
    // 41. FINAL ERROR HANDLER
    // ========================================================

    } catch (
        error
    ) {

        console.error("");
        console.error(
            "================================================"
        );

        console.error(
            "❌ CREATE ORDER FAILED"
        );

        console.error(
            "================================================"
        );


        console.error(
            "ERROR MESSAGE =",
            error.message
        );


        console.error(
            "FULL ERROR =",
            error
        );


        return res.status(
            500
        ).json({

            success:
                false,

            message:
                "Failed to create order",

            error:
                error.message

        });

    }

};
// ======================================================
// CLEANUP FAILED ORDER
// ======================================================

function cleanupFailedOrder(
    orderId,
    res,
    message
) {

    console.log(
        "🧹 CLEANING FAILED ORDER =",
        orderId
    );


    // ==================================================
    // DELETE ORDER ITEMS FIRST
    // ==================================================

    db.query(
        `
            DELETE FROM order_items
            WHERE order_id = ?
        `,
        [orderId],
        (itemDeleteError) => {

            if (itemDeleteError) {

                console.error(
                    "❌ ORDER ITEM CLEANUP ERROR:",
                    itemDeleteError
                );

            }


            // ==================================================
            // DELETE ORDER
            // ==================================================

            db.query(
                `
                    DELETE FROM orders
                    WHERE id = ?
                `,
                [orderId],
                (orderDeleteError) => {

                    if (orderDeleteError) {

                        console.error(
                            "❌ ORDER CLEANUP ERROR:",
                            orderDeleteError
                        );

                    }


                    return res.status(400).json({

                        success: false,

                        message:
                            message ||
                            "Order creation failed"

                    });

                }
            );

        }
    );

}


// ======================================================
// INVENTORY DEDUCTION
// ======================================================

function deductInventory(
    menuItem,
    quantity,
    orderType,
    callback
) {

    const menuId =
        menuItem.id;


    // ==================================================
    // SOLD COLUMN
    // ==================================================

    let soldColumn =
        "online_sold";


    if (
        orderType === "Manual"
    ) {

        soldColumn =
            "offline_sold";

    }


    console.log(
        "📦 INVENTORY MENU ID =",
        menuId
    );

    console.log(
        "📦 ORDER QUANTITY =",
        quantity
    );

    console.log(
        "📈 SOLD COLUMN =",
        soldColumn
    );


    // ==================================================
    // UPDATE INVENTORY TABLE
    // ==================================================
    //
    // IMPORTANT:
    // Stock is stored in inventory table.
    // menu table contains food/menu information only.
    //
    // current_stock  = remaining stock
    // stock_quantity = remaining stock
    //
    // Both are decreased by the ordered quantity.
    // ==================================================

    const updateSql = `
        UPDATE inventory
        SET
            current_stock =
                current_stock - ?,

            stock_quantity =
                stock_quantity - ?,

            ${soldColumn} =
                COALESCE(${soldColumn}, 0) + ?

        WHERE menu_id = ?

          AND current_stock >= ?

          AND stock_quantity >= ?
    `;


    db.query(
        updateSql,
        [
            quantity,
            quantity,
            quantity,
            menuId,
            quantity,
            quantity
        ],
        (
            updateError,
            result
        ) => {

            if (
                updateError
            ) {

                console.error(
                    "❌ INVENTORY UPDATE ERROR:",
                    updateError
                );

                return callback(
                    updateError
                );

            }


            // ==================================================
            // STOCK NOT UPDATED
            // ==================================================

            if (
                result.affectedRows === 0
            ) {

                console.error(
                    "❌ STOCK BECAME INSUFFICIENT"
                );

                return callback(
                    new Error(
                        "Stock became insufficient while processing order"
                    )
                );

            }


            console.log(
                "========================================"
            );

            console.log(
                "📦 INVENTORY DEDUCTION SUCCESS"
            );

            console.log(
                "Menu ID =",
                menuId
            );

            console.log(
                "Quantity Deducted =",
                quantity
            );

            console.log(
                "========================================"
            );


            callback(
                null
            );

        }
    );

}


// ======================================================
// ASSIGN DELIVERY BOY
// ======================================================

function assignDeliveryBoy(
    orderId,
    shopId,
    callback
) {

    console.log(
        "🚚 SEARCHING FOR DELIVERY BOY"
    );


    // ==================================================
    // FIND AVAILABLE DELIVERY BOY
    // ==================================================

    const staffSql = `
        SELECT
            s.id,
            s.name,
            s.phone
        FROM staff s

        WHERE s.role = 'DeliveryBoy'

          AND s.status = 'Active'

          AND s.online_status = 'Online'

          AND s.on_leave = 0

          AND NOT EXISTS (

                SELECT 1

                FROM delivery_assignments da

                WHERE da.delivery_boy_id = s.id

                  AND da.status IN
                  (
                      'Assigned',
                      'Accepted',
                      'OutForDelivery'
                  )

          )

        ORDER BY
            s.id ASC

        LIMIT 1
    `;


    db.query(
        staffSql,
        (
            staffError,
            staffRows
        ) => {

            if (
                staffError
            ) {

                console.error(
                    "❌ DELIVERY BOY QUERY ERROR:",
                    staffError
                );

                return callback(
                    staffError
                );

            }


            // ==================================================
            // NO DELIVERY BOY AVAILABLE
            // ==================================================

            if (
                !staffRows ||
                staffRows.length === 0
            ) {

                console.log(
                    "⚠️ NO AVAILABLE DELIVERY BOY"
                );

                return callback(
                    null,
                    {
                        assigned: false
                    }
                );

            }


            const deliveryBoy =
                staffRows[0];


            console.log(
                "🚚 DELIVERY BOY SELECTED =",
                deliveryBoy
            );


            // ==================================================
            // CREATE DELIVERY ASSIGNMENT
            // ==================================================

            const assignmentSql = `
                INSERT INTO delivery_assignments
                (
                    order_id,
                    delivery_boy_id,
                    status
                )
                VALUES
                (
                    ?,
                    ?,
                    'Assigned'
                )
            `;


            db.query(
                assignmentSql,
                [
                    orderId,
                    deliveryBoy.id
                ],
                (
                    assignmentError,
                    assignmentResult
                ) => {

                    if (
                        assignmentError
                    ) {

                        console.error(
                            "❌ ASSIGNMENT INSERT ERROR:",
                            assignmentError
                        );

                        return callback(
                            assignmentError
                        );

                    }


                    console.log(
                        "========================================"
                    );

                    console.log(
                        "🚚 DELIVERY ASSIGNED SUCCESSFULLY"
                    );

                    console.log(
                        "Order ID =",
                        orderId
                    );

                    console.log(
                        "DeliveryBoy ID =",
                        deliveryBoy.id
                    );

                    console.log(
                        "Assignment ID =",
                        assignmentResult.insertId
                    );

                    console.log(
                        "========================================"
                    );


                    // ==================================================
                    // RETURN ASSIGNMENT RESULT
                    // ==================================================

                    return callback(
                        null,
                        {
                            assigned: true,

                            assignmentId:
                                assignmentResult.insertId,

                            deliveryBoyId:
                                deliveryBoy.id,

                            deliveryBoyName:
                                deliveryBoy.name,

                            deliveryBoyPhone:
                                deliveryBoy.phone
                        }
                    );

                }
            );

        }
    );

}
// ============================================================
// GET PENDING ORDERS
// GET /api/orders/pending
// ============================================================

exports.getPendingOrders = (req, res) => {

    console.log(
        "🔥 GET PENDING ORDERS"
    );

    const sql = `
        SELECT
            o.*,

            c.name AS customer_name,
            c.phone AS customer_phone,
            c.delivery_address,
            c.latitude AS customer_latitude,
            c.longitude AS customer_longitude,

            s.shop_name,
            s.phone AS shop_phone,
            
            s.latitude AS shop_latitude,
            s.longitude AS shop_longitude
(
    SELECT da.status
    FROM delivery_assignments da
    WHERE da.order_id = o.id
    ORDER BY da.id DESC
    LIMIT 1
) AS delivery_status
        FROM orders o

        LEFT JOIN customers c
            ON c.id = o.customer_id

        LEFT JOIN shop_settings s
            ON s.id = o.shop_id

        WHERE o.order_status = 'Pending'

        ORDER BY o.created_at ASC
    `;

    db.query(
        sql,
        (err, results) => {

            if (err) {

                console.error(
                    "❌ GET PENDING ORDERS ERROR:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Failed to load pending orders",
                    error: err.message
                });

            }

            console.log(
                "✅ PENDING ORDERS:",
                results.length
            );

            return res.status(200).json(
                results
            );

        }
    );

};


// ============================================================
// GET ORDER BY TOKEN
// GET /api/orders/token/:token
// ============================================================

exports.getOrderByToken = (req, res) => {

    const token =
        req.params.token;

    console.log(
        "🔎 GET ORDER BY TOKEN:",
        token
    );


    if (!token) {

        return res.status(400).json({
            success: false,
            message: "Token is required"
        });

    }


    const orderSql = `
        SELECT
            o.*,

            c.name AS customer_name,
            c.phone AS customer_phone,
            c.pending_cancellation_amount,
            c.orderType AS customer_order_type,
            c.tableNumber AS customer_table_number,
            c.delivery_address,
            c.latitude AS customer_latitude,
            c.longitude AS customer_longitude,

            s.shop_name,
            s.phone AS shop_phone,

            s.latitude AS shop_latitude,
            s.longitude AS shop_longitude,

            (
                SELECT da.status
                FROM delivery_assignments da
                WHERE da.order_id = o.id
                ORDER BY da.id DESC
                LIMIT 1
            ) AS delivery_status

        FROM orders o

        LEFT JOIN customers c
            ON c.id = o.customer_id

        LEFT JOIN shop_settings s
            ON s.id = o.shop_id

        WHERE o.token_number = ?

        LIMIT 1
    `;


    db.query(
        orderSql,
        [token],
        (err, orders) => {

            if (err) {

                console.error(
                    "❌ GET ORDER BY TOKEN ERROR:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message: "Database error",
                    error: err.message
                });

            }


            if (
                !orders ||
                orders.length === 0
            ) {

                return res.status(404).json({
                    success: false,
                    message: "Order not found"
                });

            }


            const order =
                orders[0];


            const itemsSql = `
                SELECT
                    oi.*,
                    m.name,
                    m.price

                FROM order_items oi

                LEFT JOIN menu m
                    ON m.id = oi.menu_id

                WHERE oi.order_id = ?
            `;


            db.query(
                itemsSql,
                [order.id],
                (
                    itemErr,
                    items
                ) => {

                    if (itemErr) {

                        console.error(
                            "❌ ORDER ITEMS ERROR:",
                            itemErr
                        );

                        return res.status(500).json({
                            success: false,
                            message:
                                "Failed to load order items",
                            error:
                                itemErr.message
                        });

                    }


                    order.items =
                        items || [];


                    return res.status(200).json({

                        success: true,

                        order

                    });

                }
            );

        }
    );

};


// ============================================================
// ACCEPT SINGLE ORDER
// POST /api/orders/accept
// Body: { order_id }
// ============================================================

exports.acceptOrder = (req, res) => {

    const {
        order_id
    } = req.body;


    console.log(
        "🔥 ACCEPT ORDER:",
        order_id
    );


    if (!order_id) {

        return res.status(400).json({
            success: false,
            message:
                "order_id is required"
        });

    }


    const sql = `
        UPDATE orders

        SET order_status = 'Accepted'

        WHERE id = ?

        AND order_status = 'Pending'
    `;


    db.query(
        sql,
        [order_id],
        (
            err,
            result
        ) => {

            if (err) {

                console.error(
                    "❌ ACCEPT ORDER ERROR:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Failed to accept order",
                    error:
                        err.message
                });

            }


            if (
                result.affectedRows === 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Order cannot be accepted. It may already be processed."
                });

            }


            console.log(
                "✅ ORDER ACCEPTED:",
                order_id
            );


            return res.status(200).json({

                success: true,

                message:
                    "Order accepted successfully",

                order_id

            });

        }
    );

};


// ============================================================
// ACCEPT ALL PENDING ORDERS
// PUT /api/orders/accept-all
// ============================================================

exports.acceptAllOrders = (
    req,
    res
) => {

    console.log(
        "🔥 ACCEPT ALL ORDERS"
    );


    const sql = `
        UPDATE orders

        SET order_status = 'Accepted'

        WHERE order_status = 'Pending'
    `;


    db.query(
        sql,
        (
            err,
            result
        ) => {

            if (err) {

                console.error(
                    "❌ ACCEPT ALL ERROR:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Failed to accept all orders",
                    error:
                        err.message
                });

            }


            console.log(
                "✅ ORDERS ACCEPTED:",
                result.affectedRows
            );


            return res.status(200).json({

                success: true,

                message:
                    "All pending orders accepted",

                affectedRows:
                    result.affectedRows

            });

        }
    );

};


// ============================================================
// PREPARING SINGLE ORDER
// POST /api/orders/preparing
// Body: { order_id }
// ============================================================

exports.preparingOrder = (
    req,
    res
) => {

    const {
        order_id
    } = req.body;


    console.log(
        "🔥 PREPARING ORDER:",
        order_id
    );


    if (!order_id) {

        return res.status(400).json({
            success: false,
            message:
                "order_id is required"
        });

    }


    const sql = `
        UPDATE orders

        SET order_status = 'Preparing'

        WHERE id = ?

        AND order_status = 'Accepted'
    `;


    db.query(
        sql,
        [order_id],
        (
            err,
            result
        ) => {

            if (err) {

                console.error(
                    "❌ PREPARING ERROR:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Failed to start preparing order",
                    error:
                        err.message
                });

            }


            if (
                result.affectedRows === 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Order cannot move to Preparing."
                });

            }


            console.log(
                "✅ ORDER PREPARING:",
                order_id
            );


            return res.status(200).json({

                success: true,

                message:
                    "Order moved to Preparing",

                order_id

            });

        }
    );

};


// ============================================================
// PREPARING ALL ORDERS
// PUT /api/orders/preparing-all
// ============================================================

exports.preparingAllOrders = (
    req,
    res
) => {

    console.log(
        "🔥 PREPARING ALL ORDERS"
    );


    const sql = `
        UPDATE orders

        SET order_status = 'Preparing'

        WHERE order_status = 'Accepted'
    `;


    db.query(
        sql,
        (
            err,
            result
        ) => {

            if (err) {

                console.error(
                    "❌ PREPARING ALL ERROR:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Failed to prepare all orders",
                    error:
                        err.message
                });

            }


            console.log(
                "✅ ORDERS MOVED TO PREPARING:",
                result.affectedRows
            );


            return res.status(200).json({

                success: true,

                message:
                    "All accepted orders moved to Preparing",

                affectedRows:
                    result.affectedRows

            });

        }
    );

};


// ============================================================
// READY ORDER
// POST /api/orders/ready
// Body: { order_id }
// ============================================================

exports.readyOrder = (
    req,
    res
) => {

    const {
        order_id
    } = req.body;


    console.log(
        "🔥 READY ORDER:",
        order_id
    );


    if (!order_id) {

        return res.status(400).json({
            success: false,
            message:
                "order_id is required"
        });

    }


    const sql = `
        UPDATE orders

        SET order_status = 'Ready'

        WHERE id = ?

        AND order_status = 'Preparing'
    `;


    db.query(
        sql,
        [order_id],
        (
            err,
            result
        ) => {

            if (err) {

                console.error(
                    "❌ READY ORDER ERROR:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Failed to mark order ready",
                    error:
                        err.message
                });

            }


            if (
                result.affectedRows === 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Order cannot be marked Ready."
                });

            }


            console.log(
                "✅ ORDER READY:",
                order_id
            );


            return res.status(200).json({

                success: true,

                message:
                    "Order marked Ready",

                order_id

            });

        }
    );

};


// ============================================================
// COMPLETE ORDER
// POST /api/orders/complete
// Body: { order_id }
// ============================================================

exports.completeOrder = (
    req,
    res
) => {

    const {
        order_id
    } = req.body;


    console.log(
        "🔥 COMPLETE ORDER:",
        order_id
    );


    if (!order_id) {

        return res.status(400).json({
            success: false,
            message:
                "order_id is required"
        });

    }


    const sql = `
        UPDATE orders

        SET order_status = 'Completed'

        WHERE id = ?

        AND order_status = 'Ready'
    `;


    db.query(
        sql,
        [order_id],
        (
            err,
            result
        ) => {

            if (err) {

                console.error(
                    "❌ COMPLETE ORDER ERROR:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Failed to complete order",
                    error:
                        err.message
                });

            }


            if (
                result.affectedRows === 0
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Order cannot be completed."
                });

            }


            console.log(
                "✅ ORDER COMPLETED:",
                order_id
            );


            return res.status(200).json({

                success: true,

                message:
                    "Order completed successfully",

                order_id

            });

        }
    );

};
// ============================================================
// UPDATE ORDER
// PUT /api/orders/update
//
// Body:
// {
//     order_id,
//     order_status,
//     payment_status,
//     payment_method
// }
// ============================================================

exports.updateOrder = (req, res) => {

    const {
        order_id,
        order_status,
        payment_status,
        payment_method
    } = req.body;


    console.log(
        "🔥 UPDATE ORDER:",
        req.body
    );


    // ========================================================
    // VALIDATE ORDER ID
    // ========================================================

    if (!order_id) {

        return res.status(400).json({
            success: false,
            message:
                "order_id is required"
        });

    }


    // ========================================================
    // DYNAMIC UPDATE ARRAYS
    // ========================================================

    const updates = [];
    const values = [];


    // ========================================================
    // ORDER STATUS
    // ========================================================

    if (order_status) {

        const allowedStatuses = [
            "Pending",
            "Accepted",
            "Preparing",
            "Ready",
            "Completed",
            "Cancelled"
        ];


        if (
            !allowedStatuses.includes(
                order_status
            )
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid order status"
            });

        }


        updates.push(
            "order_status = ?"
        );

        values.push(
            order_status
        );

    }


    // ========================================================
    // PAYMENT STATUS
    // ========================================================

    if (payment_status) {

        const allowedPaymentStatuses = [
            "Pending",
            "Paid"
        ];


        if (
            !allowedPaymentStatuses.includes(
                payment_status
            )
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid payment status"
            });

        }


        updates.push(
            "payment_status = ?"
        );

        values.push(
            payment_status
        );

    }


    // ========================================================
    // PAYMENT METHOD
    // ========================================================

    if (payment_method) {

        const allowedPaymentMethods = [
            "Cash",
            "UPI",
            "Card"
        ];


        if (
            !allowedPaymentMethods.includes(
                payment_method
            )
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid payment method"
            });

        }


        updates.push(
            "payment_method = ?"
        );

        values.push(
            payment_method
        );

    }


    // ========================================================
    // NOTHING TO UPDATE
    // ========================================================

    if (
        updates.length === 0
    ) {

        return res.status(400).json({
            success: false,
            message:
                "No valid fields to update"
        });

    }


    // ========================================================
    // ORDER ID
    // ========================================================

    values.push(
        order_id
    );


    // ========================================================
    // UPDATE QUERY
    // ========================================================

    const sql = `
        UPDATE orders

        SET
            ${updates.join(", ")}

        WHERE id = ?
    `;


    db.query(
        sql,
        values,
        (
            err,
            result
        ) => {

            if (err) {

                console.error(
                    "❌ UPDATE ORDER ERROR:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Failed to update order",
                    error:
                        err.message
                });

            }


            // ==================================================
            // ORDER NOT FOUND
            // ==================================================

            if (
                result.affectedRows === 0
            ) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Order not found"
                });

            }


            console.log(
                "✅ ORDER UPDATED:",
                order_id
            );


            return res.status(200).json({

                success: true,

                message:
                    "Order updated successfully",

                order_id

            });

        }
    );

};


// ============================================================
// CANCEL ORDER
// PUT /api/orders/cancel
//
// Body:
// {
//     order_id
// }
exports.cancelOrder = (
    req,
    res
) => {

    const {
        order_id
    } = req.body;


    // ========================================================
    // VALIDATE
    // ========================================================

    if (!order_id) {

        return res.status(400).json({
            success: false,
            message:
                "order_id is required"
        });

    }


    // ========================================================
    // FIRST GET ORDER
    // ========================================================

    const getOrderSql = `
        SELECT
            o.id,
            o.customer_id,
            o.order_type,
            o.order_status,
            o.total_amount,
            da.id AS assignment_id,
            da.status AS delivery_status

        FROM orders o

        LEFT JOIN delivery_assignments da
            ON da.order_id = o.id

        WHERE o.id = ?
    `;


    db.query(
        getOrderSql,
        [order_id],
        (
            err,
            results
        ) => {
  console.log("CANCEL ORDER QUERY RESULT:", results);
        console.log("CANCEL ORDER ID:", order_id);
            if (err) {

                return res.status(500).json({
                    success: false,
                    message:
                        "Failed to check order",
                    error:
                        err.message
                });

            }


            if (
                results.length === 0
            ) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Order not found"
                });

            }


            const order =
                results[0];


            // ==================================================
            // DELIVERY ORDER
            // ==================================================

            if (
                order.order_type === "Delivery"
            ) {

                // ----------------------------------------------
                // MUST HAVE ASSIGNMENT
                // ----------------------------------------------

                if (
                    !order.assignment_id
                ) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "Delivery Boy has not accepted this order yet."
                    });

                }


                // ----------------------------------------------
                // CHECK DELIVERY STATUS DIRECTLY
                // ----------------------------------------------

                const deliveryStatus =
                    String(
                        order.delivery_status || ""
                    ).trim();


                if (
                    deliveryStatus !== "Accepted" &&
                    deliveryStatus !== "PickedUp"
                ) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "Order cannot be cancelled at this delivery stage.",
                        delivery_status:
                            deliveryStatus
                    });

                }

            }


            // ==================================================
            // CANCELLATION AMOUNT
            // ==================================================

            const cancellationAmount =
                Number(
                    order.total_amount
                ) || 0;


            // ==================================================
            // GET CONNECTION
            // ==================================================

            db.getConnection(
                (
                    connectionError,
                    connection
                ) => {

                    if (connectionError) {

                        return res.status(500).json({
                            success: false,
                            message:
                                "Failed to start cancellation",
                            error:
                                connectionError.message
                        });

                    }


                    // ==================================================
                    // START TRANSACTION
                    // ==================================================

                    connection.beginTransaction(
                        (
                            transactionError
                        ) => {

                            if (transactionError) {

                                connection.release();

                                return res.status(500).json({
                                    success: false,
                                    message:
                                        "Failed to start cancellation",
                                    error:
                                        transactionError.message
                                });

                            }


                            // ==================================================
                            // 1. CANCEL ORDER
                            // ==================================================

                            const cancelOrderSql = `
                                UPDATE orders

                                SET
                                    order_status = 'Cancelled'

                                WHERE id = ?

                                AND order_status NOT IN (
                                    'Completed',
                                    'Cancelled'
                                )
                            `;


                            connection.query(
                                cancelOrderSql,
                                [order_id],
                                (
                                    cancelError,
                                    cancelResult
                                ) => {

                                    if (cancelError) {

                                        return connection.rollback(
                                            () => {

                                                connection.release();

                                                return res.status(500).json({
                                                    success: false,
                                                    message:
                                                        "Failed to cancel order",
                                                    error:
                                                        cancelError.message
                                                });

                                            }
                                        );

                                    }


                                    if (
                                        cancelResult.affectedRows === 0
                                    ) {

                                        return connection.rollback(
                                            () => {

                                                connection.release();

                                                return res.status(400).json({
                                                    success: false,
                                                    message:
                                                        "Order cannot be cancelled."
                                                });

                                            }
                                        );

                                    }


                                    // ==================================================
                                    // 2. DELIVERY ASSIGNMENT
                                    // ==================================================

                                    if (
                                        order.order_type === "Delivery"
                                    ) {

                                        const cancelAssignmentSql = `
                                            UPDATE delivery_assignments

                                            SET
                                                status = 'Cancelled'

                                            WHERE id = ?

                                            AND status IN (
                                                'Accepted',
                                                'PickedUp'
                                            )
                                        `;


                                        connection.query(
                                            cancelAssignmentSql,
                                            [order.assignment_id],
                                            (
                                                assignmentError,
                                                assignmentResult
                                            ) => {

                                                if (
                                                    assignmentError
                                                ) {

                                                    return connection.rollback(
                                                        () => {

                                                            connection.release();

                                                            return res.status(500).json({
                                                                success: false,
                                                                message:
                                                                    "Failed to cancel delivery assignment",
                                                                error:
                                                                    assignmentError.message
                                                            });

                                                        }
                                                    );

                                                }


                                                if (
                                                    assignmentResult.affectedRows === 0
                                                ) {

                                                    return connection.rollback(
                                                        () => {

                                                            connection.release();

                                                            return res.status(400).json({
                                                                success: false,
                                                                message:
                                                                    "Delivery assignment cannot be cancelled."
                                                            });

                                                        }
                                                    );

                                                }


                                                updateCustomerAmount();

                                            }
                                        );

                                    }

                                    else {

                                        commitCancellation();

                                    }


                                    // ==================================================
                                    // 3. ADD CANCELLED AMOUNT
                                    // ==================================================

                                    function updateCustomerAmount() {

                                        if (
                                            !order.customer_id
                                        ) {

                                            return connection.rollback(
                                                () => {

                                                    connection.release();

                                                    return res.status(400).json({
                                                        success: false,
                                                        message:
                                                            "Customer not found."
                                                    });

                                                }
                                            );

                                        }


                                        const customerSql = `
                                            UPDATE customers

                                            SET
                                                pending_cancellation_amount =
                                                pending_cancellation_amount + ?

                                            WHERE id = ?
                                        `;


                                        connection.query(
                                            customerSql,
                                            [
                                                cancellationAmount,
                                                order.customer_id
                                            ],
                                            (
                                                customerError,
                                                customerResult
                                            ) => {

                                                if (
                                                    customerError
                                                ) {

                                                    return connection.rollback(
                                                        () => {

                                                            connection.release();

                                                            return res.status(500).json({
                                                                success: false,
                                                                message:
                                                                    "Failed to save cancellation amount",
                                                                error:
                                                                    customerError.message
                                                            });

                                                        }
                                                    );

                                                }


                                                if (
                                                    customerResult.affectedRows === 0
                                                ) {

                                                    return connection.rollback(
                                                        () => {

                                                            connection.release();

                                                            return res.status(400).json({
                                                                success: false,
                                                                message:
                                                                    "Customer not found."
                                                            });

                                                        }
                                                    );

                                                }


                                                commitCancellation();

                                            }
                                        );

                                    }


                                    // ==================================================
                                    // 4. COMMIT
                                    // ==================================================

                                    function commitCancellation() {

                                        connection.commit(
                                            (
                                                commitError
                                            ) => {

                                                if (commitError) {

                                                    return connection.rollback(
                                                        () => {

                                                            connection.release();

                                                            return res.status(500).json({
                                                                success: false,
                                                                message:
                                                                    "Failed to complete cancellation",
                                                                error:
                                                                    commitError.message
                                                            });

                                                        }
                                                    );

                                                }


                                                connection.release();


                                                // ==========================================
                                                // SUCCESS
                                                // ==========================================

                                                return res.status(200).json({

                                                    success: true,

                                                    message:
                                                        `Order cancelled successfully. ₹${cancellationAmount.toFixed(2)} will be adjusted from your next order.`,

                                                    order_id,

                                                    cancellation_amount:
                                                        cancellationAmount,

                                                    delivery_status:
                                                        "Cancelled"

                                                });

                                            }
                                        );

                                    }

                                }
                            );

                        }
                    );

                }
            );

        }
    );

};


// ============================================================
// GET PENDING PAYMENTS
// GET /api/orders/pending-payment
// ============================================================

exports.getPendingPayments = (
    req,
    res
) => {

    console.log(
        "🔥 GET PENDING PAYMENTS"
    );


    const sql = `
        SELECT
            o.*,

            c.name AS customer_name,
            c.phone AS customer_phone,

            s.shop_name

        FROM orders o

        LEFT JOIN customers c
            ON c.id = o.customer_id

        LEFT JOIN shop_settings s
            ON s.id = o.shop_id

        WHERE o.payment_status = 'Pending'

        ORDER BY o.created_at ASC
    `;


    db.query(
        sql,
        (
            err,
            results
        ) => {

            if (err) {

                console.error(
                    "❌ PENDING PAYMENT ERROR:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Failed to load pending payments",
                    error:
                        err.message
                });

            }


            return res.status(200).json(
                results
            );

        }
    );

};


// ============================================================
// RECEIVE PAYMENT
// PUT /api/orders/payment
//
// Body:
// {
//     order_id: 123,
//     payment_method: "Cash"
// }
// ============================================================

exports.receivePayment = (
    req,
    res
) => {

    const {
        order_id,
        payment_method
    } = req.body;


    console.log(
        "💰 RECEIVE PAYMENT:",
        req.body
    );


    // ========================================================
    // VALIDATE ORDER ID
    // ========================================================

    if (!order_id) {

        return res.status(400).json({
            success: false,
            message:
                "order_id is required"
        });

    }


    // ========================================================
    // ALLOWED PAYMENT METHODS
    // ========================================================

    const allowedMethods = [
        "Cash",
        "UPI",
        "Card"
    ];


    if (
        payment_method &&
        !allowedMethods.includes(
            payment_method
        )
    ) {

        return res.status(400).json({
            success: false,
            message:
                "Invalid payment method"
        });

    }


    let sql;
    let values;


    // ========================================================
    // PAYMENT METHOD PROVIDED
    // ========================================================

    if (payment_method) {

        sql = `
            UPDATE orders

            SET
                payment_status = 'Paid',
                payment_method = ?

            WHERE id = ?
        `;


        values = [
            payment_method,
            order_id
        ];

    }

    // ========================================================
    // PAYMENT METHOD NOT PROVIDED
    // ========================================================

    else {

        sql = `
            UPDATE orders

            SET
                payment_status = 'Paid'

            WHERE id = ?
        `;


        values = [
            order_id
        ];

    }


    // ========================================================
    // EXECUTE PAYMENT UPDATE
    // ========================================================

    db.query(
        sql,
        values,
        (
            err,
            result
        ) => {

            if (err) {

                console.error(
                    "❌ RECEIVE PAYMENT ERROR:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Failed to receive payment",
                    error:
                        err.message
                });

            }


            // ==================================================
            // ORDER NOT FOUND
            // ==================================================

            if (
                result.affectedRows === 0
            ) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Order not found"
                });

            }


            console.log(
                "✅ PAYMENT RECEIVED:",
                order_id
            );


            return res.status(200).json({

                success: true,

                message:
                    "Payment received successfully",

                order_id,

                payment_status:
                    "Paid"

            });

        }
    );

};
// ============================================================
// PART 4
// DELIVERY + DISTANCE CONTROLLERS
// ============================================================


// ============================================================
// GET DELIVERY ORDERS
// GET /api/orders/delivery
//
// Returns:
// - customer information
// - customer coordinates
// - shop information
// - shop coordinates
// - stored delivery distance
// ============================================================

exports.getDeliveryOrders = (req, res) => {

    console.log(
        "🚚 GET DELIVERY ORDERS API RUNNING"
    );


    const sql = `
        SELECT

            o.id AS order_id,
            o.token_number,
            o.order_type,
            o.order_status,
            o.payment_status,
            o.payment_method,
            o.total_amount,
            o.distance_km,
            o.distance_source,
            o.created_at,

            c.id AS customer_id,
            c.name AS customer_name,
            c.phone AS customer_phone,
            c.delivery_address,
            c.latitude AS customer_latitude,
            c.longitude AS customer_longitude,

            s.id AS shop_id,
            s.shop_name,
            s.phone AS shop_phone,

            s.latitude AS shop_latitude,
            s.longitude AS shop_longitude

        FROM orders o

        LEFT JOIN customers c
            ON c.id = o.customer_id

        LEFT JOIN shop_settings s
            ON s.id = o.shop_id

        WHERE o.order_type = 'Delivery'

        ORDER BY o.created_at DESC
    `;


    db.query(
        sql,
        (err, results) => {

            if (err) {

                console.error(
                    "❌ GET DELIVERY ORDERS ERROR:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Failed to load delivery orders",
                    error:
                        err.message
                });

            }


            console.log(
                "🚚 DELIVERY ORDERS FOUND =",
                results.length
            );


            return res.status(200).json(
                results
            );

        }
    );

};


// ============================================================
// GET DELIVERY ORDER BY ID
// GET /api/orders/delivery/:orderId
// ============================================================

exports.getDeliveryOrderById = (req, res) => {

    const orderId =
        req.params.orderId;


    console.log(
        "🚚 GET DELIVERY ORDER:",
        orderId
    );


    if (!orderId) {

        return res.status(400).json({
            success: false,
            message:
                "Order ID is required"
        });

    }


    const sql = `
        SELECT

            o.id AS order_id,
            o.token_number,
            o.order_type,
            o.order_status,
            o.payment_status,
            o.payment_method,
            o.total_amount,
            o.distance_km,
            o.distance_source,
            o.created_at,

            c.id AS customer_id,
            c.name AS customer_name,
            c.phone AS customer_phone,
            c.delivery_address,
            c.latitude AS customer_latitude,
            c.longitude AS customer_longitude,

            s.id AS shop_id,
            s.shop_name,
            s.phone AS shop_phone,

            s.latitude AS shop_latitude,
            s.longitude AS shop_longitude

        FROM orders o

        LEFT JOIN customers c
            ON c.id = o.customer_id

        LEFT JOIN shop_settings s
            ON s.id = o.shop_id

        WHERE o.id = ?

          AND o.order_type = 'Delivery'

        LIMIT 1
    `;


    db.query(
        sql,
        [orderId],
        (err, results) => {

            if (err) {

                console.error(
                    "❌ GET DELIVERY ORDER ERROR:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Failed to load delivery order",
                    error:
                        err.message
                });

            }


            if (
                !results ||
                results.length === 0
            ) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Delivery order not found"
                });

            }


            return res.status(200).json({

                success: true,

                order:
                    results[0]

            });

        }
    );

};


// ============================================================
// GET DELIVERY DISTANCE
// GET /api/orders/delivery-distance/:orderId
//
// IMPORTANT:
// This function READS the already verified distance.
//
// createOrder()
//       ↓
// OSRM calculates road distance
//       ↓
// orders.distance_km
//       ↓
// this API reads it
// ============================================================

exports.getDeliveryDistance = (req, res) => {

    const orderId =
        req.params.orderId;


    console.log(
        "📏 GET DELIVERY DISTANCE:",
        orderId
    );


    if (!orderId) {

        return res.status(400).json({
            success: false,
            message:
                "Order ID is required"
        });

    }


    const sql = `
        SELECT

            o.id AS order_id,
            o.distance_km,
            o.distance_source,

            c.latitude AS customer_latitude,
            c.longitude AS customer_longitude,

            s.latitude AS shop_latitude,
            s.longitude AS shop_longitude

        FROM orders o

        LEFT JOIN customers c
            ON c.id = o.customer_id

        LEFT JOIN shop_settings s
            ON s.id = o.shop_id

        WHERE o.id = ?

        LIMIT 1
    `;


    db.query(
        sql,
        [orderId],
        (err, results) => {

            if (err) {

                console.error(
                    "❌ DELIVERY DISTANCE ERROR:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Failed to get delivery distance",
                    error:
                        err.message
                });

            }


            if (
                !results ||
                results.length === 0
            ) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Order not found"
                });

            }


            const data =
                results[0];


            // ==================================================
            // DISTANCE MUST EXIST
            // ==================================================

            if (
                data.distance_km === null ||
                data.distance_km === undefined
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Delivery distance has not been calculated"
                });

            }


            console.log(
                "📏 STORED DISTANCE =",
                data.distance_km,
                "KM"
            );


            return res.status(200).json({

                success: true,

                order_id:
                    data.order_id,

                distance_km:
                    Number(
                        data.distance_km
                    ),

                distance_source:
                    data.distance_source,

                shop_latitude:
                    Number(
                        data.shop_latitude
                    ),

                shop_longitude:
                    Number(
                        data.shop_longitude
                    ),

                customer_latitude:
                    Number(
                        data.customer_latitude
                    ),

                customer_longitude:
                    Number(
                        data.customer_longitude
                    )

            });

        }
    );

};
// ============================================================
// GET ORDERS BY DELIVERY BOY
//
// GET /api/orders/delivery-boy/:deliveryBoyId
// ============================================================

exports.getOrdersByDeliveryBoy = (req, res) => {

    const deliveryBoyId =
        req.params.deliveryBoyId;


    console.log(
        "🚚 GET ORDERS BY DELIVERY BOY:",
        deliveryBoyId
    );


    if (!deliveryBoyId) {

        return res.status(400).json({
            success: false,
            message:
                "DeliveryBoy ID is required"
        });

    }


    const sql = `

        SELECT

            da.id AS assignment_id,
            da.status AS delivery_status,
            da.delivery_boy_id,

            o.id AS order_id,
            o.token_number,
            o.order_type,
            o.order_status,
            o.payment_status,
            o.payment_method,
            o.total_amount,
            o.distance_km,
            o.distance_source,
            o.created_at,

            c.name AS customer_name,
            c.phone AS customer_phone,
            c.delivery_address,
            c.latitude AS customer_latitude,
            c.longitude AS customer_longitude,

            s.shop_name,
            s.phone AS shop_phone,

            s.latitude AS shop_latitude,
            s.longitude AS shop_longitude

        FROM delivery_assignments da

        INNER JOIN orders o
            ON o.id = da.order_id

        LEFT JOIN customers c
            ON c.id = o.customer_id

        LEFT JOIN shop_settings s
            ON s.id = o.shop_id

        WHERE da.delivery_boy_id = ?

        ORDER BY da.id DESC

    `;


    db.query(
        sql,
        [deliveryBoyId],
        (err, results) => {

            if (err) {

                console.error(
                    "❌ DELIVERY BOY ORDERS ERROR:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Failed to load DeliveryBoy orders",
                    error:
                        err.message
                });

            }


            return res.status(200).json(
                results
            );

        }
    );

};


// ============================================================
// GET ACTIVE DELIVERY FOR DELIVERY BOY
//
// GET /api/orders/delivery-boy/:deliveryBoyId/active
//
// Active statuses:
// Assigned
// Accepted
// OutForDelivery
// ============================================================

exports.getActiveDeliveryForDeliveryBoy = (req, res) => {

    const deliveryBoyId =
        req.params.deliveryBoyId;


    console.log(
        "🚚 GET ACTIVE DELIVERY:",
        deliveryBoyId
    );


    if (!deliveryBoyId) {

        return res.status(400).json({
            success: false,
            message:
                "DeliveryBoy ID is required"
        });

    }


    const sql = `

        SELECT

            da.id AS assignment_id,
            da.status AS delivery_status,
            da.delivery_boy_id,

            o.id AS order_id,
            o.token_number,
            o.order_type,
            o.order_status,
            o.total_amount,
            o.distance_km,
            o.distance_source,
            o.created_at,

            c.name AS customer_name,
            c.phone AS customer_phone,
            c.delivery_address,
            c.latitude AS customer_latitude,
            c.longitude AS customer_longitude,

            s.shop_name,
            s.phone AS shop_phone,
            s.latitude AS shop_latitude,
            s.longitude AS shop_longitude

        FROM delivery_assignments da

        INNER JOIN orders o
            ON o.id = da.order_id

        LEFT JOIN customers c
            ON c.id = o.customer_id

        LEFT JOIN shop_settings s
            ON s.id = o.shop_id

        WHERE da.delivery_boy_id = ?

          AND da.status IN
          (
              'Assigned',
              'Accepted',
              'OutForDelivery'
          )

        ORDER BY da.id DESC

        LIMIT 1

    `;


    db.query(
        sql,
        [deliveryBoyId],
        (err, results) => {

            if (err) {

                console.error(
                    "❌ ACTIVE DELIVERY ERROR:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Failed to load active delivery",
                    error:
                        err.message
                });

            }


            // ==================================================
            // NO ACTIVE DELIVERY
            // ==================================================

            if (
                !results ||
                results.length === 0
            ) {

                return res.status(200).json({

                    success: true,

                    activeDelivery:
                        null

                });

            }


            // ==================================================
            // ACTIVE DELIVERY FOUND
            // ==================================================

            return res.status(200).json({

                success: true,

                activeDelivery:
                    results[0]

            });

        }
    );

};
// ============================================================
// DELIVERY PAYMENT PREVIEW
//
// GET /api/orders/delivery-payment/:orderId
//
// This does NOT finalize payment.
//
// It only calculates:
// distance × rate
//
// Example:
// 4.60 KM × ₹17 = ₹78.20
// ============================================================

exports.getDeliveryPaymentPreview = (req, res) => {

    const orderId =
        req.params.orderId;


    const ratePerKm =
        Number(
            req.query.rate_per_km || 0
        );


    console.log(
        "💰 DELIVERY PAYMENT PREVIEW"
    );


    console.log(
        "Order ID =",
        orderId
    );


    console.log(
        "Rate/KM =",
        ratePerKm
    );


    // ========================================================
    // VALIDATE ORDER ID
    // ========================================================

    if (!orderId) {

        return res.status(400).json({
            success: false,
            message:
                "Order ID is required"
        });

    }


    // ========================================================
    // VALIDATE RATE
    // ========================================================

    if (
        !Number.isFinite(ratePerKm) ||
        ratePerKm < 0
    ) {

        return res.status(400).json({
            success: false,
            message:
                "Valid rate_per_km is required"
        });

    }


    // ========================================================
    // GET ORDER + DELIVERY ASSIGNMENT
    // ========================================================

    const sql = `

        SELECT

            o.id AS order_id,
            o.distance_km,
            o.distance_source,

            da.delivery_boy_id,
            da.status AS delivery_status

        FROM orders o

        LEFT JOIN delivery_assignments da
            ON da.order_id = o.id

        WHERE o.id = ?

        ORDER BY da.id DESC

        LIMIT 1

    `;


    db.query(
        sql,
        [orderId],
        (err, results) => {

            // ==================================================
            // DATABASE ERROR
            // ==================================================

            if (err) {

                console.error(
                    "❌ PAYMENT PREVIEW ERROR:",
                    err
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Failed to calculate delivery payment",
                    error:
                        err.message
                });

            }


            // ==================================================
            // ORDER NOT FOUND
            // ==================================================

            if (
                !results ||
                results.length === 0
            ) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Order not found"
                });

            }


            const order =
                results[0];


            // ==================================================
            // DISTANCE NOT AVAILABLE
            // ==================================================

            if (
                order.distance_km === null ||
                order.distance_km === undefined
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Delivery distance is not available"
                });

            }


            // ==================================================
            // CONVERT DISTANCE TO NUMBER
            // ==================================================

            const distanceKm =
                Number(
                    order.distance_km
                );


            // ==================================================
            // PAYMENT CALCULATION
            // ==================================================

            const payment =
                Number(
                    (
                        distanceKm *
                        ratePerKm
                    ).toFixed(2)
                );


            console.log(
                "📏 DISTANCE =",
                distanceKm,
                "KM"
            );


            console.log(
                "💰 PAYMENT = ₹",
                payment
            );


            // ==================================================
            // RESPONSE
            // ==================================================

            return res.status(200).json({

                success: true,

                order_id:
                    order.order_id,

                delivery_boy_id:
                    order.delivery_boy_id,

                delivery_status:
                    order.delivery_status,

                distance_km:
                    distanceKm,

                distance_source:
                    order.distance_source,

                rate_per_km:
                    ratePerKm,

                delivery_payment:
                    payment

            });

        }
    );

};


// ============================================================
// END OF PART 4
// ============================================================

console.log(
    "✅ DELIVERY + DISTANCE CONTROLLERS LOADED"
);




