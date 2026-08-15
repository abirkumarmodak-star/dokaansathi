import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const CustomerMenu = () => {

    const { qrCode } = useParams();

    const navigate = useNavigate();

    const [menu, setMenu] = useState([]);

    const [cart, setCart] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    // ===========================
    // LOAD MENU
    // ===========================

    useEffect(() => {

        if (qrCode) {

            localStorage.setItem(
                "qrCode",
                qrCode
            );

        }

        fetchMenu();

        const savedCart =
            JSON.parse(
                localStorage.getItem("cart")
            ) || [];

        setCart(savedCart);

    }, [qrCode]);


    // ===========================
    // FETCH MENU FROM BACKEND
    // ===========================

    const fetchMenu = async () => {

        try {

            setLoading(true);

            setError("");

            const response = await fetch(
                "https://dokaansathi.onrender.com/api/menu"
            );

            const data =
                await response.json();

            console.log(
                "MENU RESPONSE :",
                data
            );

            if (!response.ok) {

                setError(
                    data.message ||
                    "Menu Loading Failed"
                );

                return;

            }


            // ===========================
            // API RESPONSE HANDLING
            // ===========================

            if (Array.isArray(data)) {

                setMenu(data);

            }

            else if (
                data &&
                Array.isArray(data.menu)
            ) {

                setMenu(data.menu);

            }

            else {

                setMenu([]);

                setError(
                    "Menu Loading Failed"
                );

            }

        }

        catch (err) {

            console.log(
                "MENU ERROR :",
                err
            );

            setError(
                "Server Connection Failed"
            );

        }

        finally {

            setLoading(false);

        }

    };


    // ===========================
    // ADD TO CART
    // ===========================
const addToCart = (
    item,
    plateType
) => {

    console.log("========== ADD TO CART DEBUG ==========");
    console.log("ITEM:", item);
    console.log("MENU ID:", item?.id);
    console.log("FOOD:", item?.name);
    console.log("CURRENT STOCK:", item?.current_stock);
    console.log("STOCK QUANTITY:", item?.stock_quantity);


    // ======================================
    // AVAILABILITY CHECK
    // ======================================

    if (
        Number(item.available) !== 1
    ) {

        alert(
            `${item.name} is currently unavailable`
        );

        return;

    }


    // ======================================
    // AVAILABLE INVENTORY STOCK
    // ======================================

    const availableStock = Number(
        item?.current_stock ??
        item?.stock_quantity ??
        0
    );


    console.log(
        "CALCULATED AVAILABLE STOCK:",
        availableStock
    );

    console.log(
        "PLATE TYPE:",
        plateType
    );


    // ======================================
    // GET SAVED CART
    // ======================================

    const savedCart =
        JSON.parse(
            localStorage.getItem("cart") || "[]"
        );


    // ======================================
    // FIND EXISTING ITEM
    // ======================================

    const existingItem =
        savedCart.find(

            product =>

                Number(product.id) ===
                Number(item.id) &&

                product.plateType ===
                plateType

        );


    // ======================================
    // CURRENT CART QUANTITY
    // ======================================

    const currentCartQuantity =
        existingItem
            ? Number(existingItem.quantity || 0)
            : 0;


    // ======================================
    // NEW TOTAL QUANTITY
    // ======================================

    const newTotalQuantity =
        currentCartQuantity + 1;


    console.log(
        "CURRENT CART QUANTITY:",
        currentCartQuantity
    );

    console.log(
        "NEW TOTAL QUANTITY:",
        newTotalQuantity
    );


    // ======================================
    // STOCK LIMIT CHECK
    // ======================================

    if (
        newTotalQuantity >
        availableStock
    ) {

        alert(
            `${item.name} এর মাত্র ${availableStock} টি বাকি আছে।`
        );

        console.log(
            "❌ STOCK LIMIT REACHED"
        );

        console.log(
            "AVAILABLE:",
            availableStock
        );

        console.log(
            "REQUESTED:",
            newTotalQuantity
        );

        return;

    }


    // ======================================
    // PRICE
    // ======================================

    const price =
        plateType === "Half"
            ? Number(item.half_price)
            : Number(item.full_price);


    // ======================================
    // UPDATE CART
    // ======================================

    if (existingItem) {

        existingItem.quantity += 1;

    }

    else {

        savedCart.push({

            id: item.id,

            name: item.name,

            category: item.category,

            plateType: plateType,

            price: price,

            quantity: 1

        });

    }


    // ======================================
    // SAVE CART
    // ======================================

    localStorage.setItem(
        "cart",
        JSON.stringify(savedCart)
    );


    setCart(
        savedCart
    );


    console.log(
        "UPDATED CART:",
        savedCart
    );


    console.log(
        "======================================"
    );


    // ======================================
    // SUCCESS ALERT
    // ======================================

    alert(
        `${item.name} (${plateType}) Added`
    );

};


    // ===========================
    // OPEN CART
    // ===========================

   const openCart = () => {

    navigate("/checkout");

};


    // ===========================
    // LOADING
    // ===========================

    if (loading) {

        return (

            <div
                style={{
                    padding: "30px",
                    textAlign: "center"
                }}
            >

                <h2>
                    Loading Menu...
                </h2>

            </div>

        );

    }


    // ===========================
    // ERROR
    // ===========================

    if (error) {

        return (

            <div
                style={{
                    padding: "30px",
                    textAlign: "center"
                }}
            >

                <h2
                    style={{
                        color: "red"
                    }}
                >
                    {error}
                </h2>

                <button
                    onClick={fetchMenu}
                >
                    Retry
                </button>

            </div>

        );

    }


    // ===========================
    // UI
    // ===========================

    return (

        <div
            style={{
                padding: "20px",
                maxWidth: "1200px",
                margin: "auto"
            }}
        >

            {/* ===========================
                HEADER
            =========================== */}

            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "25px",
                    gap: "15px",
                    flexWrap: "wrap"
                }}
            >

                <div>

                    <h1>
                        🍽 Customer Menu
                    </h1>

                    <p>
                        Select your food and add it to cart.
                    </p>

                </div>


                {/* CART BUTTON */}

                <button
                    onClick={openCart}
                    style={{
                        padding: "12px 20px",
                        cursor: "pointer",
                        fontWeight: "bold"
                    }}
                >

                    🛒 Cart ({cart.length})

                </button>

            </div>


            {/* ===========================
                NO MENU
            =========================== */}

            {menu.length === 0 && (

                <div
                    style={{
                        textAlign: "center",
                        padding: "40px"
                    }}
                >

                    <h2>
                        Menu is empty
                    </h2>

                    <p>
                        No food items are currently available.
                    </p>

                </div>

            )}


            {/* ===========================
                MENU GRID
            =========================== */}

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns:
                        "repeat(auto-fit, minmax(250px, 1fr))",
                    gap: "20px"
                }}
            >

                {

                    menu.map((item) => {

                        // ===========================
                        // IMPORTANT
                        // API FIELD:
                        // available: 1 / 0
                        // ===========================

                        const isAvailable =
                            Number(
                                item.available
                            ) === 1;


                        return (

                            <div
                                key={item.id}
                                style={{
                                    border: "1px solid #ddd",
                                    borderRadius: "12px",
                                    padding: "20px",
                                    boxShadow:
                                        "0 2px 8px rgba(0,0,0,0.08)",
                                    opacity:
                                        isAvailable
                                            ? 1
                                            : 0.65
                                }}
                            >

                                {/* ===========================
                                    FOOD NAME
                                =========================== */}

                                <h2>
                                    {item.name}
                                </h2>


                                {/* ===========================
                                    CATEGORY
                                =========================== */}

                                <p>

                                    <strong>
                                        Category:
                                    </strong>{" "}

                                    {item.category}

                                </p>


                                {/* ===========================
                                    AVAILABILITY
                                =========================== */}

                                {

                                    isAvailable ? (

                                        <p
                                            style={{
                                                color: "green",
                                                fontWeight: "bold"
                                            }}
                                        >
                                            🟢 Available
                                        </p>

                                    ) : (

                                        <p
                                            style={{
                                                color: "red",
                                                fontWeight: "bold"
                                            }}
                                        >
                                            🔴 Currently Unavailable
                                        </p>

                                    )

                                }


                                {/* ===========================
                                    AVAILABLE ITEM
                                =========================== */}

                                {

                                    isAvailable ? (

                                        <>

                                            {/* HALF + FULL */}

                                            {

                                                item.half_price &&
                                                item.full_price ? (

                                                    <div>

                                                        <p>

                                                            Half:
                                                            ₹
                                                            {
                                                                item.half_price
                                                            }

                                                        </p>

                                                        <button
                                                            onClick={() =>
                                                                addToCart(
                                                                    item,
                                                                    "Half"
                                                                )
                                                            }
                                                            style={{
                                                                marginRight:
                                                                    "8px",
                                                                padding:
                                                                    "10px",
                                                                cursor:
                                                                    "pointer"
                                                            }}
                                                        >

                                                            ➕ Add Half

                                                        </button>


                                                        <p>

                                                            Full:
                                                            ₹
                                                            {
                                                                item.full_price
                                                            }

                                                        </p>

                                                        <button
                                                            onClick={() =>
                                                                addToCart(
                                                                    item,
                                                                    "Full"
                                                                )
                                                            }
                                                            style={{
                                                                padding:
                                                                    "10px",
                                                                cursor:
                                                                    "pointer"
                                                            }}
                                                        >

                                                            ➕ Add Full

                                                        </button>

                                                    </div>

                                                ) : (

                                                    /* FULL ONLY */

                                                    <div>

                                                        <p>

                                                            Price:
                                                            ₹
                                                            {
                                                                item.full_price
                                                            }

                                                        </p>

                                                        <button
                                                            onClick={() =>
                                                                addToCart(
                                                                    item,
                                                                    "Full"
                                                                )
                                                            }
                                                            style={{
                                                                padding:
                                                                    "10px",
                                                                cursor:
                                                                    "pointer"
                                                            }}
                                                        >

                                                            ➕ Add To Cart

                                                        </button>

                                                    </div>

                                                )

                                            }

                                        </>

                                    ) : (

                                        /* ===========================
                                            UNAVAILABLE ITEM
                                        =========================== */

                                        <div
                                            style={{
                                                marginTop: "15px",
                                                padding: "12px",
                                                background:
                                                    "#f5f5f5",
                                                borderRadius: "8px",
                                                textAlign: "center"
                                            }}
                                        >

                                            <strong>
                                                ❌ Not Available
                                            </strong>

                                            <p>
                                                Please choose another item.
                                            </p>

                                        </div>

                                    )

                                }

                            </div>

                        );

                    })

                }

            </div>


            {/* ===========================
                CART BUTTON BOTTOM
            =========================== */}

            {

                cart.length > 0 && (

                    <div
                        style={{
                            marginTop: "30px",
                            textAlign: "center"
                        }}
                    >

                        <button
                            onClick={openCart}
                            style={{
                                padding:
                                    "14px 30px",
                                fontSize:
                                    "16px",
                                fontWeight:
                                    "bold",
                                cursor:
                                    "pointer"
                            }}
                        >

                            🛒 View Cart ({cart.length})

                        </button>

                    </div>

                )

            }

        </div>

    );

};

export default CustomerMenu;
