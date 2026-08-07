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
    // Load Menu
    // ===========================

    useEffect(() => {

    localStorage.setItem("qrCode", qrCode);

    fetchMenu();

    const savedCart =
        JSON.parse(localStorage.getItem("cart")) || [];

    setCart(savedCart);

}, [qrCode]);

    const fetchMenu = async () => {

        try {

            const response = await fetch(
                "http://10.109.215.8:5000/api/menu"
            );

            const data = await response.json();

            console.log("MENU RESPONSE :", data);

            if (Array.isArray(data)) {

                setMenu(data);

            }
            else if (data.success) {

                setMenu(data.menu);

            }
            else {

                setError("Menu Loading Failed");

            }

        }
        catch (err) {

            console.log(err);

            setError("Server Connection Failed");

        }
        finally {

            setLoading(false);

        }

    };
    // ===========================
// ADD TO CART
// ===========================

const addToCart = (item, plateType) => {

    const price =
        plateType === "Half"
            ? Number(item.half_price)
            : Number(item.full_price);

    const savedCart =
        JSON.parse(localStorage.getItem("cart")) || [];

    const existingItem = savedCart.find(

        product =>

            product.id === item.id &&

            product.plateType === plateType

    );

    if (existingItem) {

        existingItem.quantity += 1;

    } else {

        savedCart.push({

            id: item.id,

            name: item.name,

            category: item.category,

            plateType: plateType,

            price: price,

            quantity: 1

        });

    }

    localStorage.setItem(
        "cart",
        JSON.stringify(savedCart)
    );

    setCart(savedCart);

    console.log("UPDATED CART :", savedCart);

    alert(`${item.name} (${plateType}) Added`);

};
// ===========================
// OPEN CART
// ===========================

const openCart = () => {

    localStorage.setItem(
        "qrCode",
        qrCode
    );

    navigate(
        `/customer/cart/${qrCode}`
    );

};
// ===========================
// LOADING
// ===========================

if (loading) {

    return (

        <h2>

            Loading Menu...

        </h2>

    );

}

// ===========================
// ERROR
// ===========================

if (error) {

    return (

        <h2>

            ❌ {error}

        </h2>

    );

}
return (

    <div
        style={{
            padding: "20px"
        }}
    >

        <h1>

            DokaanSathi AI Menu

        </h1>

        <p>

            Table QR : {qrCode}

        </p>

        <button
            onClick={openCart}
        >

            🛒 View Cart ({cart.length})

        </button>
                <hr />

        {

            menu.map((item) => (

                <div
                    key={item.id}
                    style={{
                        border: "1px solid #ddd",
                        borderRadius: "10px",
                        padding: "15px",
                        marginTop: "15px"
                    }}
                >

                    <h2>

                        {item.name}

                    </h2>

                    <p>

                        Category : {item.category}

                    </p>

                    <p>

                        Serving :

                        {" "}

                        {item.serving_size}

                        {" "}

                        ({item.serving_type})

                    </p>

                    {

                        item.half_price ? (

                            <>

                                <p>

                                    Half Plate :

                                    ₹ {item.half_price}

                                </p>

                                <button

                                    onClick={() =>
                                        addToCart(
                                            item,
                                            "Half"
                                        )
                                    }

                                >

                                    🍽 Add Half

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

                                    🍛 Add Full

                                </button>

                            </>

                        ) : (

                            <>

                                <p>

                                    Price :

                                    ₹ {item.full_price}

                                </p>

                                <button

                                    onClick={() =>
                                        addToCart(
                                            item,
                                            "Full"
                                        )
                                    }

                                >

                                    ➕ Add To Cart

                                </button>

                            </>

                        )

                    }

                </div>

            ))

        }

    </div>

);

};

export default CustomerMenu;