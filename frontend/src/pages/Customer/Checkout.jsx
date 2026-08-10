import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Checkout.css";

function Checkout() {

    const navigate = useNavigate();

    const [cartItems, setCartItems] = useState([]);

    const [customerName, setCustomerName] = useState("");

    const [phone, setPhone] = useState("");

    const [orderType, setOrderType] = useState("Dine-In");
const tableNumber = 1;
console.log("TABLE NUMBER =", tableNumber);
    const [address, setAddress] = useState("");

    const [landmark, setLandmark] = useState("");

    const [paymentMethod, setPaymentMethod] = useState("Cash");
    const [paymentDone, setPaymentDone] = useState(false);

    const [instruction, setInstruction] = useState("");

    useEffect(() => {

        const cart =
            JSON.parse(localStorage.getItem("cart")) || [];

        setCartItems(cart);

    }, []);

    const total = cartItems.reduce(

        (sum, item) =>

            sum + item.price * item.quantity,

        0

    );
const payNow = () => {
alert("Please scan the shop QR Code or use the UPI ID to complete the payment using your mobile.");
    const upiId = "MAB.037135003970219@AXISBANK";

    const shopName = "JANA FOOD HUB";

    const amount = total;

    const upiLink =
`upi://pay?pa=${upiId}&pn=${encodeURIComponent(shopName)}&am=${amount}&cu=INR`;

    window.location.href = upiLink;

};
    // ==========================================
    // CONFIRM ORDER
    // ==========================================

    const confirmOrder = async () => {

    console.log("Confirm Button Clicked");
        try {

            // Existing Order?
            const existingOrderId =
                localStorage.getItem("existingOrderId");
console.log("Existing Order ID:", existingOrderId);
            // ==========================================
            // ADD MORE ITEMS FLOW
            // ==========================================

            if (existingOrderId) {

                for (const item of cartItems) {

                    const response = await fetch(

                        "https://dokaansathi.onrender.com/api/order-items/add",

                        {

                            method: "POST",

                            headers: {

                                "Content-Type":
                                    "application/json"

                            },

                            body: JSON.stringify({

                                order_id: existingOrderId,

                                menu_id: item.id,

                                quantity: item.quantity,

                                price: item.price

                            })

                        }

                    );

                    const data = await response.json();

                    if (!response.ok) {

                        alert(data.message);

                        return;

                    }

                }

                localStorage.removeItem("cart");

                const token =
                    localStorage.getItem("existingToken");

                localStorage.removeItem("existingOrderId");

                localStorage.removeItem("existingToken");

                navigate("/order-tracking", {

                    state: {

                        token

                    }

                });

                return;

            }

            // ==========================================
            // NEW CUSTOMER
            // ==========================================

            const customerResponse = await fetch(

                "https://dokaansathi.onrender.com/api/customers",

                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body: JSON.stringify({

                        name: customerName,

                        phone: phone,

                        orderType: orderType,

                        tableNumber:

                            orderType === "Dine-In"

                                ? tableNumber

                                : null

                    })

                }

            );

            const customerData = await customerResponse.json();

console.log("========== CUSTOMER RESPONSE ==========");
console.log(customerData);
console.log("Customer Response Status:", customerResponse.status);
console.log("======================================");

if (!customerResponse.ok) {
    alert(customerData.message || "Customer Create Failed");
    return;
}

const customerId = customerData.customerId;

console.log("Customer ID :", customerId);

            // ==========================================
            // CREATE ORDER
            // ==========================================
console.log({
    customer_id: customerId,
    table_number: tableNumber,
    order_type: orderType,
    payment_method: paymentMethod,
    total_amount: total
});
            const orderResponse = await fetch(

                "https://dokaansathi.onrender.com/api/orders",

                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body: JSON.stringify({

                        customer_id: customerId,

                        table_number:

                            orderType === "Dine-In"

                                ? tableNumber

                                : null,

                        order_type: orderType,

                        payment_status: "Pending",

                        order_status: "Pending",


                        total_amount: total,

                        payment_method:
                            paymentMethod,

       items: cartItems.map(item => ({

    menu_id: item.id,

    quantity: item.quantity,

    price: item.price,

    plate_type: item.plateType

}))               

                    })

                }

            );
const orderData = await orderResponse.json();

console.log("========== ORDER RESPONSE ==========");
console.log(orderData);
console.log("Order ID :", orderData.order_id);
console.log("Token :", orderData.token);
console.log("===================================");

           // ==========================================
// UPDATE TABLE STATUS
// ==========================================

if (orderType === "Dine-In") {

   console.log("========== TABLE API REQUEST ==========");

console.log({
    table_number: Number(tableNumber),
    order_id: orderData.order_id
});

const tableResponse = await fetch(
    "https://dokaansathi.onrender.com/api/restaurant-tables/status",
    {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            table_number: Number(tableNumber),
            order_id: orderData.order_id
        })
    }
);

const tableData = await tableResponse.json();

console.log("========== TABLE API RESPONSE ==========");
console.log(tableData);
console.log("========================================");

        
              

               

     

    if (!tableResponse.ok) {

        alert(tableData.message);

        return;

    }

}

            localStorage.setItem(
                "tokenNumber",
                orderData.token
            );

            localStorage.removeItem("cart");

            navigate("/order-success");

        }

        catch (error) {

            console.log(error);

            alert("Server Error");

        }

    };
        return (

        <div className="checkout-page">

            <h1>🧾 Checkout</h1>
{orderType === "Dine-In" && (

    <h3>

        🍽 Table Number : {tableNumber}

    </h3>

)}
            <input
                type="text"
                placeholder="Customer Name (Optional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
            />

            <input
                type="text"
                placeholder="Phone (Optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
            />

            <select
    value={paymentMethod}
    onChange={(e) => setPaymentMethod(e.target.value)}
>
    <option value="Cash">Cash</option>
    <option value="UPI">UPI</option>
</select>

         {paymentMethod === "Cash" && (

    <div
        style={{
            marginTop: "15px",
            padding: "12px",
            background: "#fff3cd",
            borderRadius: "8px"
        }}
    >

        <h3>💵 Pay at Counter</h3>

        <p>
            Please pay your bill at the counter after your meal.
        </p>

    </div>

)}  
{paymentMethod === "UPI" && (

    <div
        style={{
            marginTop: "15px",
            padding: "15px",
            background: "#d4edda",
            borderRadius: "10px"
        }}
    >

        <h3>📱 UPI Payment</h3>

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
        width: "220px",
        margin: "15px 0",
        border: "1px solid #ddd",
        borderRadius: "10px"
    }}
/>
        <button
            onClick={payNow}
        >
            💳 Pay Now
        </button>

        <br /><br />

       <button
    onClick={() => {

        setPaymentDone(true);

        confirmOrder();

    }}
    disabled={cartItems.length === 0 || paymentDone}
>

    {
        paymentDone
            ? "✅ Payment Submitted"
            : "✅ I Have Paid"
    }

</button>

    </div>

)}

            {orderType === "Online" && (

                <>

                    <input
                        type="text"
                        placeholder="Delivery Address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                    />

                    <input
                        type="text"
                        placeholder="Landmark"
                        value={landmark}
                        onChange={(e) => setLandmark(e.target.value)}
                    />

                </>

            )}

          

           

            <h2>Your Order</h2>

            {

                cartItems.length === 0

                    ?

                    <p>Your cart is empty.</p>

                    :

                    cartItems.map((item) => (

                        <div key={item.id}>

                            <p>

                                {item.name} × {item.quantity}

                            </p>

                            <p>

                                ₹ {item.price * item.quantity}

                            </p>

                        </div>

                    ))

            }

            <h2>Total : ₹ {total}</h2>
{paymentMethod === "Cash" && (

    <button
        onClick={confirmOrder}
        disabled={cartItems.length === 0}
    >
        ✅ Confirm Order
    </button>

)}

        </div>

    );

}

export default Checkout;
