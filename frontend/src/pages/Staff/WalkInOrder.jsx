import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function WalkInCustomer() {

    const navigate = useNavigate();

    const [menu, setMenu] = useState([]);
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [placingOrder, setPlacingOrder] = useState(false);

    // Walk-in customer information
    const [customerName, setCustomerName] = useState(
        "Manual Customer"
    );

    const [customerPhone, setCustomerPhone] = useState("");

    // Load menu
    useEffect(() => {

        loadMenu();

    }, []);

    const loadMenu = async () => {

        try {

            const response = await fetch(
                "https://dokaansathi.onrender.com/api/menu"
            );

            const data = await response.json();

            console.log("MENU:", data);

            const menuData =
                Array.isArray(data)
                    ? data
                    : data.menu || [];

            setMenu(menuData);

        }
        catch (error) {

            console.error("MENU ERROR:", error);

            alert("Cannot load menu");

        }
        finally {

            setLoading(false);

        }

    };

    // =========================
    // ADD TO CART
    // =========================

    const addToCart = (item, plateType) => {

        const price =
            plateType === "Half"
                ? Number(item.half_price)
                : Number(item.full_price);

        const existingIndex = cart.findIndex(
            x =>
                x.id === item.id &&
                x.plateType === plateType
        );

        if (existingIndex !== -1) {

            const updatedCart = [...cart];

            updatedCart[existingIndex].quantity += 1;

            setCart(updatedCart);

        }
        else {

            setCart([
                ...cart,

                {
                    id: item.id,
                    menu_id: item.id,
                    name: item.name,
                    plateType,
                    price,
                    quantity: 1
                }

            ]);

        }

    };

    // =========================
    // INCREASE
    // =========================

    const increaseQuantity = (index) => {

        const updatedCart = [...cart];

        updatedCart[index].quantity += 1;

        setCart(updatedCart);

    };

    // =========================
    // DECREASE
    // =========================

    const decreaseQuantity = (index) => {

        const updatedCart = [...cart];

        if (updatedCart[index].quantity > 1) {

            updatedCart[index].quantity -= 1;

        }
        else {

            updatedCart.splice(index, 1);

        }

        setCart(updatedCart);

    };

    // =========================
    // TOTAL
    // =========================

    const total = cart.reduce(

        (sum, item) =>

            sum +
            Number(item.price) *
            Number(item.quantity),

        0

    );

    // =========================
    // PLACE WALK-IN ORDER
    // =========================

    const placeWalkInOrder = async () => {

        if (cart.length === 0) {

            alert("Please select at least one food item");

            return;

        }

        if (!customerName.trim()) {

            alert("Please enter customer name");

            return;

        }

        try {

            setPlacingOrder(true);

            // =====================================
            // STEP 1: CREATE WALK-IN CUSTOMER
            // =====================================

            const customerResponse = await fetch(

                "https://dokaansathi.onrender.com/api/customers",

                {

                    method: "POST",

                    headers: {

                        "Content-Type": "application/json"

                    },

                    body: JSON.stringify({

                        name: customerName,

                        phone:
                            customerPhone.trim() ||
                            null,

                        orderType: "Manual",

                        tableNumber: null

                    })

                }

            );

            const customerData =
                await customerResponse.json();

            console.log(
                "CUSTOMER RESPONSE:",
                customerData
            );

            if (!customerResponse.ok) {

                throw new Error(

                    customerData.message ||
                    "Customer creation failed"

                );

            }

            const customerId =
                customerData.customerId;

            if (!customerId) {

                throw new Error(
                    "Customer ID was not returned"
                );

            }

            // =====================================
            // STEP 2: PREPARE ORDER ITEMS
            // =====================================

            const orderItems = cart.map(item => ({

                menu_id: item.menu_id,

                quantity: item.quantity,

                price: Number(item.price)

            }));

            // =====================================
            // STEP 3: CREATE ORDER
            // =====================================

            const orderResponse = await fetch(

                "https://dokaansathi.onrender.com/api/orders",

                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body: JSON.stringify({

                        customer_id:
                            customerId,

                        table_number:
                            null,

                        order_type:
                            "Manual",

                        payment_method:
                            "Cash",

                        items:
                            orderItems,

                        total_amount:
                            total

                    })

                }

            );

            const orderData =
                await orderResponse.json();

            console.log(
                "ORDER RESPONSE:",
                orderData
            );

            if (!orderResponse.ok) {

                throw new Error(

                    orderData.message ||
                    "Order creation failed"

                );

            }

            // =====================================
            // SUCCESS
            // =====================================

            alert(

                `Manual Order Created Successfully!\n\n` +

                `Order ID: ${orderData.order_id}\n` +

                `Token: ${orderData.token}\n` +

                `Total: ₹${total}`

            );

            // Clear cart

            setCart([]);

            // Go back to staff dashboard

            navigate("/staff-dashboard");

        }
        catch (error) {

            console.error(
                "MANUAL ORDER ERROR:",
                error
            );

            alert(
                error.message ||
                "Failed to create Walk-in order"
            );

        }
        finally {

            setPlacingOrder(false);

        }

    };

    // =========================
    // LOADING
    // =========================

    if (loading) {

        return (

            <div style={{ padding: "20px" }}>

                <h2>Loading Menu...</h2>

            </div>

        );

    }

    // =========================
    // UI
    // =========================

    return (

        <div
            style={{
                padding: "20px",
                maxWidth: "1000px",
                margin: "auto"
            }}
        >

            <h1>
                🚶 Manual Customer
            </h1>

            <p>
                Staff can manually create an order
                for customers who do not use QR/website.
            </p>

            <hr />

            {/* CUSTOMER INFORMATION */}

            <h2>
                👤 Customer Information
            </h2>

            <div
                style={{
                    marginBottom: "20px"
                }}
            >

                <input
                    type="text"
                    placeholder="Customer Name"
                    value={customerName}
                    onChange={(e) =>
                        setCustomerName(
                            e.target.value
                        )
                    }
                    style={{
                        padding: "10px",
                        marginRight: "10px"
                    }}
                />

                <input
                    type="tel"
                    placeholder="Phone Number (optional)"
                    value={customerPhone}
                    onChange={(e) =>
                        setCustomerPhone(
                            e.target.value
                        )
                    }
                    style={{
                        padding: "10px"
                    }}
                />

            </div>

            <hr />

            {/* MENU */}

            <h2>
                🍽 Select Food
            </h2>

            <div>

                {menu.map(item => (

                    <div
                        key={item.id}
                        style={{
                            border:
                                "1px solid #ddd",

                            padding: "15px",

                            marginBottom: "10px",

                            borderRadius: "10px"
                        }}
                    >

                        <h3>
                            {item.name}
                        </h3>

                        <p>
                            Category:
                            {" "}
                            {item.category}
                        </p>

                        {!Number(item.available) ? (

                            <strong>
                                ❌ Unavailable
                            </strong>

                        ) : (

                            <div>

                                <button
                                    onClick={() =>
                                        addToCart(
                                            item,
                                            "Half"
                                        )
                                    }
                                >
                                    Half ₹
                                    {item.half_price}
                                </button>

                                {" "}

                                <button
                                    onClick={() =>
                                        addToCart(
                                            item,
                                            "Full"
                                        )
                                    }
                                >
                                    Full ₹
                                    {item.full_price}
                                </button>

                            </div>

                        )}

                    </div>

                ))}

            </div>

            <hr />

            {/* CART */}

            <h2>
                🛒 Current Order
            </h2>

            {cart.length === 0 ? (

                <p>
                    No food selected.
                </p>

            ) : (

                <div>

                    {cart.map(
                        (item, index) => (

                            <div
                                key={index}
                                style={{
                                    padding: "12px",

                                    marginBottom: "8px",

                                    border:
                                        "1px solid #ddd",

                                    borderRadius:
                                        "8px"
                                }}
                            >

                                <strong>
                                    {item.name}
                                </strong>

                                {" - "}

                                {item.plateType}

                                <br />

                                ₹{item.price}

                                <br />

                                <button
                                    onClick={() =>
                                        decreaseQuantity(
                                            index
                                        )
                                    }
                                >
                                    −
                                </button>

                                {" "}

                                {item.quantity}

                                {" "}

                                <button
                                    onClick={() =>
                                        increaseQuantity(
                                            index
                                        )
                                    }
                                >
                                    +
                                </button>

                            </div>

                        )
                    )}

                    <h2>
                        Total: ₹{total}
                    </h2>

                    <button
                        onClick={placeWalkInOrder}
                        disabled={placingOrder}
                        style={{
                            padding:
                                "12px 20px",

                            fontSize:
                                "16px",

                            cursor:
                                placingOrder
                                    ? "not-allowed"
                                    : "pointer"
                        }}
                    >

                        {placingOrder
                            ? "Creating Order..."
                            : "🧾 Place Walk-in Order"}

                    </button>

                </div>

            )}

            <br />
            <br />

            <button
                onClick={() =>
                    navigate(
                        "/staff-dashboard"
                    )
                }
            >
                ← Back to Staff Dashboard
            </button>

        </div>

    );

}

export default WalkInCustomer;