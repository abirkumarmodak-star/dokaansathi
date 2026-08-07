import { useEffect, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";
import "./Cart.css";

function Cart() {

    const navigate = useNavigate();

    const [cartItems, setCartItems] = useState([]);
const { qrCode } = useParams();
    // ==========================
    // LOAD CART
    // ==========================

    useEffect(() => {

        loadCart();

    }, []);

    const loadCart = () => {

        const rawCart = localStorage.getItem("cart");

        console.log("RAW CART :", rawCart);

        const cart = rawCart
            ? JSON.parse(rawCart)
            : [];

        console.log("PARSED CART :", cart);

        setCartItems(cart);

    };

    // ==========================
    // INCREASE QUANTITY
    // ==========================

    const increaseQuantity = (id, plateType) => {

    const updatedCart = cartItems.map((item) =>

        item.id === id &&
        item.plateType === plateType

            ? {

                ...item,

                quantity: item.quantity + 1

            }

            : item

    );

    localStorage.setItem(
        "cart",
        JSON.stringify(updatedCart)
    );

    setCartItems(updatedCart);

};
    // ==========================
    // DECREASE QUANTITY
    // ==========================

   const decreaseQuantity = (id, plateType) => {

    let updatedCart = cartItems.map((item) =>

        item.id === id &&
        item.plateType === plateType

            ? {

                ...item,

                quantity: item.quantity - 1

            }

            : item

    );

    updatedCart = updatedCart.filter(

        item => item.quantity > 0

    );

    localStorage.setItem(

        "cart",

        JSON.stringify(updatedCart)

    );

    setCartItems(updatedCart);

};




    // ==========================
    // REMOVE ITEM
    // ==========================

    const removeItem = (id, plateType) => {

    const updatedCart = cartItems.filter(

        item => !(

            item.id === id &&

            item.plateType === plateType

        )

    );

    localStorage.setItem(

        "cart",

        JSON.stringify(updatedCart)

    );

    setCartItems(updatedCart);

};

    // ==========================
    // TOTAL PRICE
    // ==========================

    const total = cartItems.reduce(

        (sum, item) =>

            sum + item.price * item.quantity,

        0

    );
        // ==========================
    // UI
    // ==========================

    return (

        <div className="cart-page">

            <h1>🛒 My Cart</h1>

            {

                cartItems.length === 0

                    ?

                    <div>

                        <h2>Your Cart is Empty</h2>

                       <button
    onClick={() =>
        navigate(`/menu/${qrCode}`)
    }
>

    🍽 Back To Menu

</button>

                    </div>

                    :

                    <>

                        {

                            cartItems.map((item) => (

                                <div

                                    key={item.id}

                                    className="cart-card"

                                >

                                    <h3>{item.name}</h3>
<p>

Plate :

<strong>

{item.plateType}

</strong>

</p>
                                    <p>

                                        Category : {item.category}

                                    </p>

                                    <p>

                                        Price : ₹ {item.price}

                                    </p>

                                    <p>

                                        Quantity :

                                        <button

                                         onClick={() =>
    decreaseQuantity(
        item.id,
        item.plateType
    )
}

                                        >

                                            -

                                        </button>

                                        <span

                                            style={{

                                                margin: "0 10px"

                                            }}

                                        >

                                            {item.quantity}

                                        </span>

                                        <button

                                          onClick={() =>
    increaseQuantity(
        item.id,
        item.plateType
    )
}

                                        >

                                            +

                                        </button>

                                    </p>

                                    <p>

                                        Subtotal :

                                        ₹ {item.price * item.quantity}

                                    </p>

                                    <button

                                       onClick={() =>
    removeItem(
        item.id,
        item.plateType
    )
}

                                    >

                                        ❌ Remove

                                    </button>

                                </div>

                            ))

                        }

                        <hr />

                        <h2>

                            Total : ₹ {total}

                        </h2>

                        <button

                           onClick={() => {

    const qrCode = localStorage.getItem("qrCode");

    navigate(`/menu/${qrCode}`);

}}

                        >

                            ➕ Add More Food

                        </button>

                        <button

                            onClick={() =>

                                navigate("/checkout")

                            }

                            style={{

                                marginLeft: "10px"

                            }}

                        >

                            ✅ Proceed To Checkout

                        </button>

                    </>

            }

        </div>

    );

}

export default Cart;