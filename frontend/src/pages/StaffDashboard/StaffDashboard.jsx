import { useEffect, useState } from "react";
import axios from "axios";
import "./StaffDashboard.css";

function StaffDashboard() {

    const [orders, setOrders] = useState([]);


   useEffect(() => {

    loadOrders();

    const interval = setInterval(() => {

        loadOrders();

    }, 5000); // প্রতি ৫ সেকেন্ডে Refresh

    return () => {

        clearInterval(interval);

    };

}, []);

    const loadOrders = async () => {

    console.log("Loading Orders...", new Date().toLocaleTimeString());
        try {

            const res = await axios.get(
                "https://dokaansathi.onrender.com/api/orders"
            );

        console.log("Orders:", res.data.orders);
            setOrders(res.data.orders);

        }

        catch (err) {

            console.log(err);

        }

    };

    // Accept Order
    const acceptOrder = async (order_id) => {

        try {

            await axios.post(
                "https://dokaansathi.onrender.com/api/orders/accept",
                {
                    order_id
                }
            );

            alert("Order Accepted");

            loadOrders();

        }

        catch (err) {

            console.log(err);

            alert("Failed to Accept Order");

        }

    };

    // Start Preparing
    const startPreparing = async (order_id) => {

        try {

            await axios.post(
                "https://dokaansathi.onrender.com/api/orders/preparing",
                {
                    order_id
                }
            );

            alert("Order is now Preparing");

            loadOrders();

        }

        catch (err) {

            console.log(err);

            alert("Failed");

        }

    };

    // Mark Ready
    const markReady = async (order_id) => {

        try {

            await axios.post(
                "https://dokaansathi.onrender.com/api/orders/ready",
                {
                    order_id
                }
            );

            alert("Order Ready");

            loadOrders();

        }

        catch (err) {

            console.log(err);

            alert("Failed");

        }

    };

    // Complete Order
    const completeOrder = async (order_id) => {

        try {

            await axios.post(
                "https://dokaansathi.onrender.com/api/orders/complete",
                {
                    order_id
                }
            );

            alert("Order Completed");

            loadOrders();

        }

        catch (err) {

            console.log(err);

            alert("Failed");

        }

    };

    return (

        <div className="staff-dashboard">

            <h1>🍽 Staff Dashboard</h1>

            <h2>Total Orders : {orders.length}</h2>

            <div className="orders-container">

                {

                    orders.map((order) => (

                        <div
                            className="order-card"
                            key={order.id}
                        >

                            <h3>Order #{order.id}</h3>

                            <p>
                                <strong>Customer ID:</strong> {order.customer_id}
                            </p>

                            <p>
                                <strong>Table:</strong> {order.table_number}
                            </p>

                            <p>
                                <strong>Order Type:</strong> {order.order_type}
                            </p>

                            <p>
                                <strong>Status:</strong> {order.order_status}
                            </p>

                            <p>
                                <strong>Payment:</strong> {order.payment_status}
                            </p>

                            <p>
                                <strong>Total:</strong> ₹{order.total_amount}
                            </p>
<h4>🍽 Ordered Items</h4>

<ul>

    {

        order.items &&

        order.items.map((item, index) => (

            <li key={index}>

                {item.name} × {item.quantity}

            </li>

        ))

    }

</ul>
                            {order.order_status === "Pending" && (

                                <button
                                    onClick={() =>
                                        acceptOrder(order.id)
                                    }
                                >
                                    Accept Order
                                </button>

                            )}

                            {order.order_status === "Accepted" && (

                                <button
                                    onClick={() =>
                                        startPreparing(order.id)
                                    }
                                >
                                    Start Preparing
                                </button>

                            )}

                            {order.order_status === "Preparing" && (

                                <button
                                    onClick={() =>
                                        markReady(order.id)
                                    }
                                >
                                    Mark Ready
                                </button>

                            )}

                            {order.order_status === "Ready" && (

                                <button
                                    onClick={() =>
                                        completeOrder(order.id)
                                    }
                                >
                                    Complete Order
                                </button>

                            )}

                            {order.order_status === "Completed" && (

                                <button disabled>
                                    ✔ Completed
                                </button>

                            )}

                            {order.order_status === "Cancelled" && (

                                <button disabled>
                                    ❌ Cancelled
                                </button>

                            )}

                        </div>

                    ))

                }

            </div>

        </div>

    );

}

export default StaffDashboard;


