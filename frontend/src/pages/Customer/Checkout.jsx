import { useEffect, useState } from "react";
import api from "../../Services/api.js";
import { useNavigate } from "react-router-dom";
import "./Checkout.css";

function Checkout() {
    const navigate = useNavigate();

    // ======================================================
    // CART
    // ======================================================

    const [cartItems, setCartItems] = useState([]);

    // ======================================================
    // CUSTOMER
    // ======================================================

    const [customerName, setCustomerName] = useState("");
    const [phone, setPhone] = useState("");

    // ======================================================
    // ORDER TYPE
    // ======================================================

    const orderType = "Delivery";

    // ======================================================
    // DELIVERY
    // ======================================================

    const [address, setAddress] = useState("");
    const [deliveryLandmarkType, setDeliveryLandmarkType] = useState("");
const [deliveryLandmarkName, setDeliveryLandmarkName] = useState("");
    const [instruction, setInstruction] = useState("");

    // ======================================================
    // PAYMENT
    // ======================================================

    const [paymentMethod, setPaymentMethod] = useState("Cash");
    const [paymentDone, setPaymentDone] = useState(false);
const [whatsappConfirmed, setWhatsappConfirmed] = useState(false);
    // ======================================================
    // LOAD CART
    // ======================================================

    useEffect(() => {
        try {
            const savedCart =
                JSON.parse(localStorage.getItem("cart")) || [];

            setCartItems(savedCart);

            console.log("========== CHECKOUT CART ==========");
            console.log(savedCart);
            console.log("===================================");
        } catch (error) {
            console.error("Cart loading error:", error);
            setCartItems([]);
        }
    }, []);

    // ======================================================
    // REMOVE ITEM
    // ======================================================

   const removeItem = (itemToRemove) => {

    const updatedCart = cartItems.filter((item) => {

        // ==============================
        // COMBO DELETE
        // ==============================
        if (itemToRemove.itemType === "combo") {

            return !(
                item.itemType === "combo" &&
                Number(item.comboId) ===
                    Number(itemToRemove.comboId)
            );

        }

        // ==============================
        // NORMAL FOOD DELETE
        // ==============================
        return !(
            item.itemType !== "combo" &&
            Number(item.id) ===
                Number(itemToRemove.id) &&
            item.plateType ===
                itemToRemove.plateType
        );

    });

    localStorage.setItem(
        "cart",
        JSON.stringify(updatedCart)
    );

    setCartItems(updatedCart);
};

    // ======================================================
    // FOOD TOTAL
    // ======================================================

    const foodTotal = cartItems.reduce(
        (sum, item) =>
            sum +
            Number(item.price || 0) *
                Number(item.quantity || 0),
        0
    );

    // ======================================================
    // DELIVERY FEE
    // ======================================================

    // Currently no delivery charge.
    const deliveryFee = 0;

    // ======================================================
    // CASHBACK
    // ======================================================

    // Future cashback system.
    // ==================================================
// CASHBACK CATEGORY MESSAGE
// ==================================================

let cashbackCategory = "";
let nextCashbackCategory = "";
let nextCashbackTarget = null;


// ==================================================
// CURRENT CASHBACK CATEGORY
// ==================================================

if (foodTotal >= 2000) {

    cashbackCategory =
        "💎 You can get Silver + Gold + Diamond Cashback with silver+gold+diamond discount now.";

}
else if (foodTotal >= 1500) {

    cashbackCategory =
        "🥇💎 You can get Gold + Diamond Cashback with gold+diamond discount now.";

}
else if (foodTotal >= 1100) {

    cashbackCategory =
        "🥈💎 You can get Silver + Diamond Cashback with silver+diamond discount now.";

}
else if (foodTotal >= 900) {

    cashbackCategory =
        "🥈🥇 You can get Silver + Gold Cashback with silver+gold discount now.";

}
else if (foodTotal >= 700) {

    cashbackCategory =
        "💎 You can get Diamond Cashback with diamond discount now.";

}
else if (foodTotal >= 500) {

    cashbackCategory =
        "🥇 You can get Gold Cashback with gold discount now.";

}
else if (foodTotal >= 300) {

    cashbackCategory =
        "🥈 You can get Silver Cashback with silver discount now.";

}
else if (foodTotal >= 250) {

    cashbackCategory =
        "🎁 You can get Super duper Cashback with super discount now.";

}
else if (foodTotal >= 200) {

    cashbackCategory =
        "🎁 You can get Super duper Cashback with super discount now.";

}
else if (foodTotal >= 50) {

    cashbackCategory =
        "🎁 You can get Super Cashback  now.";

}


// ==========================

// ==================================================
// NEXT CASHBACK CATEGORY
// ==================================================
if (foodTotal < 50) {

    nextCashbackTarget = 50;

    nextCashbackCategory =
        "Super Cashback";

}
else if (foodTotal < 200) {

    nextCashbackTarget = 200;

    nextCashbackCategory =
        "Super duper Cashback+super discount";

}
else if (foodTotal < 300) {

    nextCashbackTarget = 300;

    nextCashbackCategory =
        "Silver Cashback+silver discount";

}
else if (foodTotal < 500) {

    nextCashbackTarget = 500;

    nextCashbackCategory =
        "Gold Cashback+Gold discount";

}
else if (foodTotal < 700) {

    nextCashbackTarget = 700;

    nextCashbackCategory =
        "Diamond Cashback+Diamond discount";

}
else if (foodTotal < 900) {

    nextCashbackTarget = 900;

    nextCashbackCategory =
        "Silver + Gold Cashback+Silver+Gold discount";

}
else if (foodTotal < 1100) {

    nextCashbackTarget = 1100;

    nextCashbackCategory =
        "Silver + Diamond Cashback+Silver+Diamond discount";

}
else if (foodTotal < 1500) {

    nextCashbackTarget = 1500;

    nextCashbackCategory =
        "Gold + Diamond Cashback+Gold+Diamond discount";

}
else if (foodTotal < 2000) {

    nextCashbackTarget = 2000;

    nextCashbackCategory =
        "Silver + Gold + Diamond Cashback+Silver+Gold+Diamond discount";

}


// ==================================================
// FINAL TOTAL
// ==================================================

// Cashback is earned after successful order.
// It is NOT deducted from checkout payment.

const total =
    foodTotal +
    deliveryFee;

    // ======================================================
    // UPI PAYMENT
    // ======================================================

const OWNER_WHATSAPP = "918670334666";

const openOwnerWhatsApp = () => {
    if (cartItems.length === 0) {
        alert("Your cart is empty.");
        return;
    }

    if (!customerName.trim() || !phone.trim() || !address.trim()) {
        alert("Please enter your name, phone number and delivery address first.");
        return;
    }

    const landmark =
        deliveryLandmarkType && deliveryLandmarkName.trim()
            ? `${deliveryLandmarkType}: ${deliveryLandmarkName.trim()}`
            : "Not provided";

    const itemsText = cartItems
        .map((item) =>
            `• ${item.name} × ${item.quantity} = ₹${(
                Number(item.price || 0) *
                Number(item.quantity || 0)
            ).toFixed(2)}`
        )
        .join("\n");

    const message = [
        "🛒 *DokaanSathi — Order Enquiry*",
        "",
        `Customer: ${customerName.trim()}`,
        `Phone: ${phone.trim()}`,
        `Address: ${address.trim()}`,
        `Landmark: ${landmark}`,
        `Payment: ${paymentMethod}`,
        "",
        "*Order Items:*",
        itemsText,
        "",
        `Food Total: ₹${foodTotal.toFixed(2)}`,
        `Delivery Fee: ₹${deliveryFee.toFixed(2)}`,
        `Total: ₹${total.toFixed(2)}`,
        `Special Instruction: ${instruction.trim() || "None"}`,
        "",
        "Please confirm my order."
    ].join("\n");

    const whatsappUrl =
        `https://wa.me/${OWNER_WHATSAPP}?text=${encodeURIComponent(message)}`;

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
};

    const payNow = () => {
        const upiId =
            "MAB.037135003970219@AXISBANK";

        const shopName =
            "JANA FOOD HUB";

        const amount = Number(total).toFixed(2);

        const upiLink =
            `upi://pay?pa=${upiId}` +
            `&pn=${encodeURIComponent(shopName)}` +
            `&am=${amount}` +
            `&cu=INR`;

        alert(
            "Please complete the payment using your UPI app."
        );

        window.location.href = upiLink;
    };

    // ======================================================
    // CONFIRM ORDER
    // ======================================================
console.log("ACTUAL CART ITEMS:", cartItems);
console.log(
    "COMBO DEBUG:",
    cartItems.map(item => ({
        itemType: item.itemType,
        comboId: item.comboId,
        id: item.id
    }))
);

    const confirmOrder = async () => {
        const deliveryLandmark =
    deliveryLandmarkType &&
    deliveryLandmarkName.trim()
        ? `${deliveryLandmarkType}: ${deliveryLandmarkName.trim()}`
        : "";
        console.log(
            "========== CONFIRM ORDER =========="
        );

        // --------------------------------------------------
        // CART VALIDATION
        // --------------------------------------------------

        if (cartItems.length === 0) {
            alert("Your cart is empty.");
            return;
        }

        // --------------------------------------------------
        // CUSTOMER NAME
        // --------------------------------------------------

        if (!customerName.trim()) {
            alert("Please enter customer name.");
            return;
        }

        // --------------------------------------------------
        // PHONE
        // --------------------------------------------------

        if (!phone.trim()) {
            alert("Please enter phone number.");
            return;
        }

        // --------------------------------------------------
        // ADDRESS
        // --------------------------------------------------

        if (!address.trim()) {
            alert(
                "Please enter your delivery address."
            );
            return;
        }

        // --------------------------------------------------
        // LANDMARK
        // --------------------------------------------------

      if (!deliveryLandmarkType) {
    alert("Please select your landmark type.");
    return;
}

if (!deliveryLandmarkName.trim()) {
    alert("Please enter the landmark name.");
    return;
}
        console.log(
            "Landmark:",
            deliveryLandmark
        );
        console.log(
            "Delivery Fee:",
            deliveryFee
        );
        console.log(
    "Cashback will be calculated by backend."
);
        console.log("Total:", total);

        try {
            // ==================================================
            // EXISTING ORDER / ADD MORE ITEMS
            // ==================================================

            const existingOrderId =
                localStorage.getItem(
                    "existingOrderId"
                );

            if (existingOrderId) {
                console.log(
                    "Adding items to existing order:",
                    existingOrderId
                );

                for (const item of cartItems) {
                    const response = await api.post(
                        "/order-items/add",
                        JSON.stringify({
                                order_id:
                                    existingOrderId,
                                menu_id:
                                    item.id,
                                quantity:
                                    item.quantity,
                                price:
                                    item.price,
                            }),
                        {
                            headers: {
                                "Content-Type": "application/json",
                                Accept: "*/*"
                            },
                            validateStatus: () => true,
                            transformResponse: [(data) => data]
                        }
                    );

                    const data = JSON.parse(response.data);

                    if (response.status < 200 || response.status >= 300) {
                        alert(
                            data.message ||
                                "Failed to add item."
                        );
                        return;
                    }
                }

                const token =
                    localStorage.getItem(
                        "existingToken"
                    );

                localStorage.removeItem("cart");
                localStorage.removeItem(
                    "existingOrderId"
                );
                localStorage.removeItem(
                    "existingToken"
                );

                navigate(
                    "/order-tracking",
                    {
                        state: {
                            token,
                        },
                    }
                );

                return true;
            }

            // ==================================================
            // CREATE CUSTOMER
            // ==================================================

            const customerPayload = {
                name: customerName.trim(),
                phone: phone.trim(),
                orderType: orderType,
                tableNumber: null,
                delivery_address:
                    address.trim(),
                latitude: null,
                longitude: null,
            };

            console.log(
                "========== CUSTOMER PAYLOAD =========="
            );

            console.log(
                JSON.stringify(
                    customerPayload,
                    null,
                    2
                )
            );

            const customerResponse = await api.post(
                "/customers",
                JSON.stringify(customerPayload),
                {
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "*/*"
                    },
                    validateStatus: () => true,
                    transformResponse: [(data) => data]
                }
            );

            const customerData = JSON.parse(customerResponse.data);

            console.log(
                "Status:",
                customerResponse.status
            );

            if (customerResponse.status < 200 || customerResponse.status >= 300) {
                alert(
                    customerData.message ||
                        "Customer creation failed."
                );
                return;
            }

            // ==================================================
            // CUSTOMER ID
            // ==================================================

            const customerId =
                customerData.customerId ||
                customerData.customer_id ||
                customerData.id;

            console.log(
                "NEW CUSTOMER ID:",
                customerId
            );

            if (!customerId) {
                alert(
                    "Customer ID was not returned from customer API."
                );
                return;
            }

            // ==================================================
            // ORDER PAYLOAD
            // ==================================================
console.log("ACTUAL CART ITEMS:", cartItems);
            const orderPayload = {
                customer_id: customerId,

                shop_id: 1,

                table_number: null,

                order_type: orderType,

                payment_status: "Pending",

                order_status: "Pending",

                total_amount: total,

                payment_method:
                    paymentMethod,

                // ------------------------------
                // DELIVERY
                // ------------------------------

                delivery_address:
                    address.trim(),

                delivery_fee:
                    deliveryFee,

                delivery_landmark:
    `${deliveryLandmarkType}: ${deliveryLandmarkName.trim()}`,

                special_instruction:
                    instruction.trim() || null,

                // ------------------------------
                // ITEMS
                // ------------------------------


items: cartItems.map((item) => {
    const quantity = Number(item.quantity);

    // Combo: send the real combo ID.
    // The backend must validate it against the combos table.
    if (item.itemType === "combo") {
        return {
            combo_id: Number(item.comboId),
            quantity,
            price: Number(item.price),
            item_type: "combo",
        };
    }

    // Normal food: preserve existing behaviour.
    return {
        menu_id: Number(
            item.menu_id ?? item.menuId ?? item.id
        ),
        quantity,
        price: Number(item.price),
        plate_type: item.plateType || null,
    };
}),



            };

            console.log(
                "========== FINAL ORDER PAYLOAD =========="
            );

            console.log(
                JSON.stringify(
                    orderPayload,
                    null,
                    2
                )
            );

            // ==================================================
            // CREATE ORDER
            // ==================================================

            const orderResponse = await api.post(
                "/orders",
                JSON.stringify(orderPayload),
                {
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "*/*"
                    },
                    validateStatus: () => true,
                    transformResponse: [(data) => data]
                }
            );

            const orderData = JSON.parse(orderResponse.data);

            console.log(
                "========== ORDER RESPONSE =========="
            );

            if (orderResponse.status < 200 || orderResponse.status >= 300) {
                alert(
                    orderData.message ||
                        "Order creation failed."
                );
                return;
            }
localStorage.setItem(
    "cashbackAmount",
    String(
        Number(
            orderData.cashbackAmount || 0
        )
    )
);
            // ==================================================
            // SAVE TOKEN
            // ==================================================

            if (orderData.tokenNumber) {
                localStorage.setItem(
                    "tokenNumber",
                    orderData.tokenNumber
                );
            }

            if (orderData.tokenNumber && orderData.trackingCapability) {
                const capabilities = JSON.parse(
                    localStorage.getItem("orderTrackingCapabilities") || "{}"
                );
                capabilities[orderData.tokenNumber] = orderData.trackingCapability;
                localStorage.setItem(
                    "orderTrackingCapabilities",
                    JSON.stringify(capabilities)
                );
            }

            // ==================================================
            // CLEAR CART
            // ==================================================

            localStorage.removeItem("cart");

            // ==================================================
            // SUCCESS
            // ==================================================

            navigate("/order-success");
            return true;
        } catch (error) {
            console.error(
                "========== CHECKOUT ERROR =========="
            );

            console.error(error);

            alert(
                "Server Error. Please try again."
            );
        }
    };

    // ======================================================
    // UI
    // ======================================================

    return (
        <div className="checkout-page">

            {/* ==================================================
                TITLE
            ================================================== */}

            <h1>🧾 Checkout</h1>

            {/* ==================================================
                CUSTOMER NAME
            ================================================== */}

            <input
                type="text"
                placeholder="Customer Name *"
                value={customerName}
                onChange={(e) =>
                    setCustomerName(
                        e.target.value
                    )
                }
            />

            {/* ==================================================
                PHONE
            ================================================== */}

            <input
                type="tel"
                placeholder="Phone Number *"
                value={phone}
                onChange={(e) =>
                    setPhone(
                        e.target.value
                    )
                }
            />

            {/* ==================================================
                NO EXTRA CHARGE MESSAGE
            ================================================== */}

            <div
                style={{
                    marginTop: "12px",
                    marginBottom: "15px",
                    padding: "15px",
                    background:
                        "#e8f7ec",
                    border:
                        "1px solid #b7dfc1",
                    borderRadius: "10px",
                    textAlign: "center",
                    fontWeight: "bold",
                    color: "#1f6f35",
                }}
            >
                🎉 No Delivery Charge
                {" • "}
                No Packaging Charge
                {" • "}
                No Platform Charge
                {" • "}
                No Extra Charges
            </div>

            {/* ==================================================
                DELIVERY DETAILS
            ================================================== */}

            <div
                style={{
                    marginTop: "15px",
                    padding: "15px",
                    border:
                        "1px solid #ddd",
                    borderRadius: "12px",
                    background: "#fff",
                }}
            >
                <h3
                    style={{
                        marginTop: 0,
                    }}
                >
                    🚚 Delivery Details
                </h3>

                {/* ADDRESS */}

                <textarea
                    placeholder="House / Flat / Building / Complete address *"
                    value={address}
                    onChange={(e) =>
                        setAddress(
                            e.target.value
                        )
                    }
                    style={{
                        width: "100%",
                        minHeight: "80px",
                        boxSizing:
                            "border-box",
                        padding: "10px",
                        border:
                            "1px solid #ccc",
                        borderRadius:
                            "10px",
                        resize: "vertical",
                    }}
                />

                {/* LANDMARK */}

   <h4
    style={{
        marginTop: "18px",
    }}
>
    📌 Nearest Landmark *
</h4>

<select
    value={deliveryLandmarkType}
    onChange={(e) => {
        setDeliveryLandmarkType(e.target.value);
        setDeliveryLandmarkName("");
    }}
    style={{
        width: "100%",
        padding: "10px",
        boxSizing: "border-box",
        border: "1px solid #ccc",
        borderRadius: "10px",
    }}
>
    <option value="">
        -- Select Landmark Type *
    </option>

    <option value="Near School">
        🏫 Near School
    </option>

    <option value="Near Mandir">
        🛕 Near Mandir
    </option>

    <option value="Near Known Location">
        📍 Near Known Location
    </option>
</select>

{deliveryLandmarkType && (
    <div style={{ marginTop: "10px" }}>

        <p
            style={{
                marginBottom: "6px",
                fontWeight: "bold",
                color: "#444",
            }}
        >
            {deliveryLandmarkType === "Near School"
                ? "🏫 Please select your school name *"
                : deliveryLandmarkType === "Near Mandir"
                ? "🛕 Please select your mandir name *"
                : "📍 Please select your known location *"}
        </p>

        <input
            type="text"
            value={deliveryLandmarkName}
            onChange={(e) =>
                setDeliveryLandmarkName(
                    e.target.value
                )
            }
            placeholder={
                deliveryLandmarkType ===
                "Near School"
                    ? "Enter school name"
                    : deliveryLandmarkType ===
                      "Near Mandir"
                    ? "Enter mandir name"
                    : "Enter known location"
            }
            style={{
                width: "100%",
                padding: "10px",
                boxSizing: "border-box",
                border: "1px solid #ccc",
                borderRadius: "10px",
            }}
        />
    </div>
)}
<select>
                    <option value="">
                        -- Select Nearest Landmark *
                    </option>

                    <option value="Near School">
                        🏫 Near School
                    </option>

                    <option value="Near Mandir">
                        🛕 Near Mandir
                    </option>

                    <option value="Near Known Location">
                        📍 Near Known Location
                    </option>
                </select>
            </div>

            {/* ==================================================
                PAYMENT METHOD
            ================================================== */}

            <select
                value={paymentMethod}
                onChange={(e) =>
                    setPaymentMethod(
                        e.target.value
                    )
                }
                style={{
                    marginTop: "15px",
                }}
            >
                <option value="Cash">
                    💵 Cash on Delivery
                </option>

                <option value="UPI">
                    📱 UPI
                </option>
            </select>

            {/* ==================================================
                CASH
            ================================================== */}

            {paymentMethod ===
                "Cash" && (
                <div
                    style={{
                        marginTop:
                            "15px",
                        padding:
                            "12px",
                        background:
                            "#fff3cd",
                        borderRadius:
                            "8px",
                    }}
                >
                    <h3>
                        💵 Cash on Delivery
                    </h3>

                    <p>
                        Please pay your bill
                        to the Delivery Boy
                        when your order is
                        delivered.
                    </p>
                </div>
            )}

            {/* ==================================================
                UPI
            ================================================== */}

            {paymentMethod ===
                "UPI" && (
                <div
                    style={{
                        marginTop:
                            "15px",
                        padding:
                            "15px",
                        background:
                            "#d4edda",
                        borderRadius:
                            "10px",
                    }}
                >
                    <h3>
                        📱 UPI Payment
                    </h3>

                    <p>
                        Shop UPI ID
                    </p>

                    <h2>
                        MAB.037135003970219@AXISBANK
                    </h2>

                    <img
                        src="/upi-qr.jpeg"
                        alt="UPI QR Code"
                        style={{
                            width:
                                "220px",
                            margin:
                                "15px 0",
                            border:
                                "1px solid #ddd",
                            borderRadius:
                                "10px",
                        }}
                    />

                    <button
                        type="button"
                        onClick={
                            payNow
                        }
                    >
                        💳 Pay Now
                    </button>

                    <br />
                    <br />

                    <button
                        type="button"
                        onClick={async () => {
                            const orderConfirmed = await confirmOrder();

                            if (orderConfirmed) {
                                setPaymentDone(true);
                            }
                        }}
                        disabled={
                            cartItems.length ===
                                0 ||
                            paymentDone
                        }
                    >
                        {paymentDone
                            ? "✅ Payment Submitted"
                            : "✅ I Have Paid"}
                    </button>
                </div>
            )}

            {/* ==================================================
                SPECIAL INSTRUCTION
            ================================================== */}

            <textarea
                placeholder="Special instruction (optional)"
                value={instruction}
                onChange={(e) =>
                    setInstruction(
                        e.target.value
                    )
                }
                style={{
                    width: "100%",
                    minHeight:
                        "80px",
                    marginTop:
                        "15px",
                    boxSizing:
                        "border-box",
                }}
            />

            {/* ==================================================
                ORDER ITEMS
            ================================================== */}

            <h2>
                Your Order
            </h2>

            {cartItems.length ===
            0 ? (
                <p>
                    Your cart is empty.
                </p>
            ) : (
                cartItems.map(
                    (item) => (
                        <div
                            key={`${item.id}-${item.plateType || ""}`}
                            style={{
                                border:
                                    "1px solid #ddd",
                                borderRadius:
                                    "10px",
                                padding:
                                    "12px",
                                marginBottom:
                                    "10px",
                            }}
                        >
                            <div
                                style={{
                                    display:
                                        "flex",
                                    justifyContent:
                                        "space-between",
                                    alignItems:
                                        "center",
                                    gap:
                                        "15px",
                                }}
                            >
                                <div>
                                    <p>
                                        <strong>
                                            {
                                                item.name
                                            }
                                        </strong>

                                        {" × "}

                                        {
                                            item.quantity
                                        }
                                    </p>

                                    {item.plateType && (
                                        <p>
                                            Plate:{" "}
                                            {
                                                item.plateType
                                            }
                                        </p>
                                    )}

                                    <p>
                                        ₹{" "}
                                        {Number(
                                            item.price
                                        ) *
                                            Number(
                                                item.quantity
                                            )}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                   onClick={() =>
    removeItem(item)
}
                                    style={{
                                        padding:
                                            "8px 12px",
                                        cursor:
                                            "pointer",
                                        border:
                                            "none",
                                        borderRadius:
                                            "6px",
                                    }}
                                >
                                    🗑 Delete
                                </button>
                            </div>
                        </div>
                    )
                )
            )}

            {/* ==================================================
                PRICE SUMMARY
            ================================================== */}

            <div
                style={{
                    marginTop:
                        "20px",
                    padding:
                        "15px",
                    borderTop:
                        "2px solid #ddd",
                }}
            >
                <p>
                    Food Total: ₹
                    {foodTotal}
                </p>

                <p>
                    Delivery Fee: ₹
                    {deliveryFee}
                </p>

            {/* ==================================================
    CASHBACK INFORMATION
================================================== */}

{cashbackCategory && (

    <p>
        {cashbackCategory}
    </p>

)}


{nextCashbackTarget !== null && (

    <p>
        Add ₹
        {
            Math.max(
                0,
                nextCashbackTarget -
                foodTotal
            )
        }
        {" "}
        more to get{" "}
        {nextCashbackCategory}.
    </p>

)}

                <h2>
                    Total: ₹
                    {total}
                </h2>
            </div>

<div
    style={{
        marginTop: "15px",
        marginBottom: "12px",
        padding: "14px",
        background: "#fff3cd",
        border: "1px solid #ffcc66",
        borderRadius: "10px",
        color: "#7a4b00",
        fontWeight: "bold",
        lineHeight: "1.6",
    }}
>
    ⚠️ Important Order Instructions

    <p style={{ marginBottom: 0 }}>
         Before clicking Confirm Order, please send your order details
    through the Order Details on WhatsApp button. Otherwise, your
    order may not reach the shop owner for confirmation. Please click
    the Order Details on WhatsApp button before clicking Confirm Order.
    </p>
</div>

            {/* ==================================================
                CONFIRM ORDER
            ================================================== */}

            {paymentMethod ===
                "Cash" && (
                <button
                    type="button"
                    onClick={
                        confirmOrder
                    }
                    disabled={
                        cartItems.length ===
                        0
                    }
                >
                    ✅ Confirm Order
                </button>
            )}

<button
    type="button"
    onClick={openOwnerWhatsApp}
    disabled={cartItems.length === 0}
    style={{
        marginTop: "12px",
        marginLeft: "8px",
        padding: "12px 18px",
        background: "#25D366",
        color: "#fff",
        border: "none",
        borderRadius: "8px",
        fontWeight: "bold",
        cursor: "pointer"
    }}
>
    💬 Order Details on WhatsApp
</button>

<label style={{ display: "block", marginTop: "12px", marginBottom: "12px" }}>
    <input
        type="checkbox"
        checked={whatsappConfirmed}
        onChange={(e) => setWhatsappConfirmed(e.target.checked)}
    />
    {" "}I have sent my order details to the owner on WhatsApp.
</label>

            {/* ==================================================
                ADD MORE FOODS
            ================================================== */}

            <button
                type="button"
                onClick={() =>
                    navigate(
                        "/customer-menu"
                    )
                }
            >
                ➕ Add More Foods
            </button>
        </div>
    );
}

// ======================================================
// DEFAULT EXPORT
// ======================================================

export default Checkout;
