import { useEffect, useState } from "react";
import axios from "axios";
import "./StaffDashboard.css";
import { useNavigate } from "react-router-dom";
const API_URL = "https://dokaansathi.onrender.com/api";

function StaffDashboard() {

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [staff, setStaff] = useState(null);
const navigate = useNavigate();
    // ==========================================
    // LOAD STAFF ACCOUNT
    // ==========================================

    useEffect(() => {

        const savedStaff = localStorage.getItem("staff");

        if (savedStaff) {

            try {

                setStaff(JSON.parse(savedStaff));

            } catch (err) {

                console.log("Staff data error:", err);

            }

        }

    }, []);

    // ==========================================
    // LOAD ORDERS
    // ==========================================

    const loadOrders = async () => {

        try {

            const savedStaff =
                localStorage.getItem("staff");

            let staffData = null;

            if (savedStaff) {

                staffData = JSON.parse(savedStaff);

            }

            console.log(
                "Loading Orders...",
                new Date().toLocaleTimeString()
            );

            const res = await axios.get(
                `${API_URL}/orders`
            );

            console.log(
                "ORDERS API RESPONSE:",
                res.data
            );

            // Backend may return:
            // { orders: [...] }
            // OR
            // [...]

            const orderList = Array.isArray(res.data)
                ? res.data
                : Array.isArray(res.data.orders)
                    ? res.data.orders
                    : [];

            setOrders(orderList);

            setError("");

        }

        catch (err) {

            console.log(
                "STAFF ORDER ERROR:",
                err
            );

            if (err.response) {

                setError(
                    err.response.data?.message ||
                    `Backend Error: ${err.response.status}`
                );

            }

            else {

                setError(
                    "Cannot connect to backend"
                );

            }

        }

        finally {

            setLoading(false);

        }

    };

    // ==========================================
    // INITIAL LOAD + AUTO REFRESH
    // ==========================================

    useEffect(() => {

        loadOrders();

        const interval = setInterval(() => {

            loadOrders();

        }, 5000);

        return () => {

            clearInterval(interval);

        };

    }, []);

    // ==========================================
    // ACCEPT ORDER
    // ==========================================

    const acceptOrder = async (orderId) => {

        try {

            await axios.post(
                `${API_URL}/orders/accept`,
                {
                    order_id: orderId
                }
            );

            alert("Order Accepted");

            loadOrders();

        }

        catch (err) {

            console.log(err);

            alert(
                err.response?.data?.message ||
                "Failed to Accept Order"
            );

        }

    };

    // ==========================================
    // START PREPARING
    // ==========================================

    const startPreparing = async (orderId) => {

        try {

            await axios.post(
                `${API_URL}/orders/preparing`,
                {
                    order_id: orderId
                }
            );

            alert("Order is now Preparing");

            loadOrders();

        }

        catch (err) {

            console.log(err);

            alert(
                err.response?.data?.message ||
                "Failed to start preparing"
            );

        }

    };

    // ==========================================
    // MARK READY
    // ==========================================

    const markReady = async (orderId) => {

        try {

            await axios.post(
                `${API_URL}/orders/ready`,
                {
                    order_id: orderId
                }
            );

            alert("Order Ready");

            loadOrders();

        }

        catch (err) {

            console.log(err);

            alert(
                err.response?.data?.message ||
                "Failed to mark order ready"
            );

        }

    };

    // ==========================================
    // COMPLETE ORDER
    // ==========================================

    const completeOrder = async (orderId) => {

        try {

            await axios.post(
                `${API_URL}/orders/complete`,
                {
                    order_id: orderId
                }
            );

            alert("Order Completed");

            loadOrders();

        }

        catch (err) {

            console.log(err);

            alert(
                err.response?.data?.message ||
                "Failed to complete order"
            );

        }

    };

    // ==========================================
    // LOGOUT
    // ==========================================

    const logout = () => {

        localStorage.removeItem("staff");

        window.location.href = "/staff-login";

    };

    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {

        return (

            <div className="staff-dashboard">

                <h1>👨‍🍳 Staff Dashboard</h1>

                <p>
                    Loading orders...
                </p>

            </div>

        );

    }

    // ==========================================
    // UI
    // ==========================================

    return (

        <div className="staff-dashboard">

            {/* HEADER */}

            <div className="staff-header">

                <div>

                    <h1>
                        👨‍🍳 Staff Dashboard
                    </h1>

                    {staff && (

                        <p>

                            Welcome,{" "}
                            <strong>
                                {staff.name}
                            </strong>

                            {" | "}

                            Role:{" "}
                            <strong>
                                {staff.role}
                            </strong>

                        </p>

                    )}

                </div>

                <button
                    onClick={logout}
                >
                    Logout
                </button>

            </div>

            {/* SUMMARY */}

            <div className="staff-summary">

                <div className="summary-card">

                    <h3>
                        Total Orders
                    </h3>

                    <strong>
                        {orders.length}
                    </strong>

                </div>

                <div className="summary-card">

                    <h3>
                        Pending
                    </h3>

                    <strong>

                        {
                            orders.filter(
                                order =>
                                    order.order_status ===
                                    "Pending"
                            ).length
                        }

                    </strong>

                </div>

                <div className="summary-card">

                    <h3>
                        Preparing
                    </h3>

                    <strong>

                        {
                            orders.filter(
                                order =>
                                    order.order_status ===
                                    "Preparing"
                            ).length
                        }

                    </strong>

                </div>

                <div className="summary-card">

                    <h3>
                        Ready
                    </h3>

                    <strong>

                        {
                            orders.filter(
                                order =>
                                    order.order_status ===
                                    "Ready"
                            ).length
                        }

                    </strong>

                </div>

            </div>

            {/* ERROR */}

            {error && (

                <div className="staff-error">

                    ⚠️ {error}

                    <button
                        onClick={loadOrders}
                    >
                        Retry
                    </button>

                </div>

            )}

            {/* ORDERS */}

            <div className="orders-container">

                {orders.length === 0 ? (

                    <div className="no-orders">

                        <h2>
                            No Orders
                        </h2>

                        <p>
                            New customer orders
                            will appear here.
                        </p>

                    </div>

                ) : (

                    orders.map((order) => (

                        <div
                            className="order-card"
                            key={order.id}
                        >

                            <div className="order-header">

                                <h2>
                                    Order #{order.id}
                                </h2>

                                <span>
                                    {order.order_status}
                                </span>

                            </div>

                            <p>
                                <strong>
                                    Customer ID:
                                </strong>{" "}
                                {order.customer_id || "-"}
                            </p>

                            <p>
                                <strong>
                                    Table:
                                </strong>{" "}
                                {order.table_number || "-"}
                            </p>

                            <p>
                                <strong>
                                    Order Type:
                                </strong>{" "}
                                {order.order_type || "-"}
                            </p>

                            <p>
                                <strong>
                                    Payment:
                                </strong>{" "}
                                {order.payment_status || "-"}
                            </p>

                            <p>
                                <strong>
                                    Total:
                                </strong>{" "}
                                ₹{order.total_amount || 0}
                            </p>

                            {/* ORDER ITEMS */}

                            {Array.isArray(order.items) &&
                                order.items.length > 0 && (

                                    <div className="order-items">

                                        <h3>
                                            Items
                                        </h3>

                                        <ul>

                                            {order.items.map(
                                                (item, index) => (

                                                    <li
                                                        key={index}
                                                    >

                                                        {item.name ||
                                                            item.item_name ||
                                                            "Item"}

                                                        {" × "}

                                                        {item.quantity}

                                                    </li>

                                                )
                                            )}

                                        </ul>

                                    </div>

                                )}

                            {/* ACTIONS */}

                            <div className="order-actions">

                                {order.order_status ===
                                    "Pending" && (

                                    <button
                                        onClick={() =>
                                            acceptOrder(
                                                order.id
                                            )
                                        }
                                    >
                                        Accept Order
                                    </button>

                                )}

                                {order.order_status ===
                                    "Accepted" && (

                                    <button
                                        onClick={() =>
                                            startPreparing(
                                                order.id
                                            )
                                        }
                                    >
                                        Start Preparing
                                    </button>

                                )}

                                {order.order_status ===
                                    "Preparing" && (

                                    <button
                                        onClick={() =>
                                            markReady(
                                                order.id
                                            )
                                        }
                                    >
                                        Mark Ready
                                    </button>

                                )}

                                {order.order_status ===
                                    "Ready" && (

                                    <button
                                        onClick={() =>
                                            completeOrder(
                                                order.id
                                            )
                                        }
                                    >
                                        Complete Order
                                    </button>

                                )}
<button
    onClick={() => navigate("/staff/walk-in")}
>
    🧓 Walk-in Customer
</button>
                                {order.order_status ===
                                    "Completed" && (

                                    <button
                                        disabled
                                    >
                                        ✔ Completed
                                    </button>

                                )}

                                {order.order_status ===
                                    "Cancelled" && (

                                    <button
                                        disabled
                                    >
                                        ❌ Cancelled
                                    </button>
                                    
                                )}

                            </div>

                        </div>

                    ))

                )}

            </div>

        </div>

    );

}

export default StaffDashboard;


