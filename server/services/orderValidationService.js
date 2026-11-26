
const db = require("../config/db");

const query = (connection, sql, params = []) =>
    new Promise((resolve, reject) => {
        connection.query(sql, params, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });

// Convert DECIMAL money value into integer paise.
const toCents = (value) => {
    const str = String(value);

    if (!/^-?\d+(\.\d{1,2})?$/.test(str)) {
        return null;
    }

    const negative = str.startsWith("-");
    const clean = negative ? str.slice(1) : str;
    const [rupees, paise = ""] = clean.split(".");

    const cents =
        Number(rupees) * 100 +
        Number((paise + "00").slice(0, 2));

    if (!Number.isSafeInteger(cents)) {
        return null;
    }

    return negative ? -cents : cents;
};

exports.validateOrderItems = async (orderId, connection = db) => {
    const normalizedOrderId = Number(orderId);

    if (
        !Number.isSafeInteger(normalizedOrderId) ||
        normalizedOrderId <= 0
    ) {
        return {
            valid: false,
            reason: "INVALID_ORDER_ID"
        };
    }

    // Step 1: Check whether the order exists.
    const orders = await query(
        connection,
        `
            SELECT id, total_amount, delivery_fee
            FROM orders
            WHERE id = ?
        `,
        [normalizedOrderId]
    );

    if (!orders.length) {
        return {
            valid: false,
            reason: "ORDER_NOT_FOUND"
        };
    }

    const orderTotalCents = toCents(orders[0].total_amount);
    const deliveryFeeCents = toCents(orders[0].delivery_fee ?? 0);

    if (
        orderTotalCents === null ||
        orderTotalCents < 0 ||
        deliveryFeeCents === null ||
        deliveryFeeCents < 0
    ) {
        return {
            valid: false,
            reason: "INVALID_ORDER_TOTAL"
        };
    }

    // Step 2: Fetch order items and validate menu references.
    const items = await query(
        connection,
        `
            SELECT
                oi.id,
                oi.order_id,
                oi.menu_id,
                oi.quantity,
                oi.price,
                oi.subtotal,
                m.id AS valid_menu_id
            FROM order_items oi
            LEFT JOIN menu m ON m.id = oi.menu_id
            WHERE oi.order_id = ?
        `,
        [normalizedOrderId]
    );

    if (!items.length) {
        return {
            valid: false,
            reason: "ORDER_HAS_NO_ITEMS"
        };
    }

    let itemTotalCents = 0;

    for (const item of items) {
        const quantity = Number(item.quantity);
        const priceCents = toCents(item.price);
        const subtotalCents = toCents(item.subtotal);

        if (!item.valid_menu_id) {
            return {
                valid: false,
                reason: "INVALID_MENU_REFERENCE",
                itemId: item.id
            };
        }

        if (!Number.isSafeInteger(quantity) || quantity <= 0) {
            return {
                valid: false,
                reason: "INVALID_QUANTITY",
                itemId: item.id
            };
        }

        if (priceCents === null || priceCents < 0) {
            return {
                valid: false,
                reason: "INVALID_PRICE",
                itemId: item.id
            };
        }

        const expectedSubtotalCents = quantity * priceCents;

        if (
            !Number.isSafeInteger(expectedSubtotalCents) ||
            subtotalCents === null ||
            subtotalCents < 0 ||
            subtotalCents !== expectedSubtotalCents
        ) {
            return {
                valid: false,
                reason: "INVALID_SUBTOTAL",
                itemId: item.id
            };
        }

        itemTotalCents += subtotalCents;

        if (!Number.isSafeInteger(itemTotalCents)) {
            return {
                valid: false,
                reason: "INVALID_ITEM_TOTAL"
            };
        }
    }

    // Step 3: Compare item total + delivery fee with orders.total_amount.
    const expectedOrderTotalCents =
        itemTotalCents + deliveryFeeCents;

    if (
        !Number.isSafeInteger(expectedOrderTotalCents) ||
        expectedOrderTotalCents !== orderTotalCents
    ) {
        return {
            valid: false,
            reason: "ORDER_TOTAL_MISMATCH",
            itemTotal: itemTotalCents / 100,
            deliveryFee: deliveryFeeCents / 100,
            expectedOrderTotal: expectedOrderTotalCents / 100,
            orderTotal: orderTotalCents / 100
        };
    }

    return {
        valid: true,
        itemCount: items.length,
        itemTotal: itemTotalCents / 100,
        deliveryFee: deliveryFeeCents / 100,
        orderTotal: orderTotalCents / 100
    };
};
