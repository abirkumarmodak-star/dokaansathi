 


import { useEffect, useState, useRef } from "react";
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
    // NOTIFICATION STATE
    // ==========================================

    const [notificationEnabled, setNotificationEnabled] = useState(
        "Notification" in window &&
        Notification.permission === "granted"
    );

    // ==========================================
    // NEW ORDER TRACKING
    // ==========================================

    const previousPendingIds = useRef(new Set());
    const firstOrderLoad = useRef(true);

    // ==========================================
    // NOTIFICATION AUDIO
    // ==========================================

    const notificationAudio = useRef(null);

    useEffect(() => {

        notificationAudio.current =
            new Audio("/notification.mp3");

        notificationAudio.current.preload = "auto";

    }, []);

    // ==========================================
    // LOAD STAFF ACCOUNT
    // ==========================================

    useEffect(() => {

        const savedStaff =
            localStorage.getItem("staff");

        if (savedStaff) {

            try {

                setStaff(
                    JSON.parse(savedStaff)
                );

            }

            catch (err) {

                console.log(
                    "Staff data error:",
                    err
                );

            }

        }

    }, []);

    // ==========================================
    // ENABLE NOTIFICATIONS
    // ==========================================

    const enableNotifications = async () => {

        if (!("Notification" in window)) {

            alert(
                "This browser does not support notifications."
            );

            return;

        }

        try {

            const permission =
                await Notification.requestPermission();

            if (permission === "granted") {

                setNotificationEnabled(true);

                // ==================================
                // PRELOAD / UNLOCK AUDIO
                // ==================================

                if (notificationAudio.current) {

                    notificationAudio.current
                        .load();

                    notificationAudio.current
                        .play()
                        .then(() => {

                            notificationAudio.current.pause();

                            notificationAudio.current.currentTime = 0;

                            console.log(
                                "🔊 Notification sound unlocked"
                            );

                        })
                        .catch((err) => {

                            console.log(
                                "Audio unlock failed:",
                                err
                            );

                        });

                }

                // ==================================
                // TEST NOTIFICATION
                // ==================================

                const notification =
                    new Notification(
                        "🔔 Dokaansathi Notifications Enabled",
                        {
                            body:
                                "You will receive new order alerts here.",
                            icon: "/favicon.svg"
                        }
                    );

                setTimeout(() => {

                    notification.close();

                }, 5000);

            }

            else {

                alert(
                    "Notification permission was not granted."
                );

            }

        }

        catch (error) {

            console.log(
                "Notification permission error:",
                error
            );

        }

    };

    // ==========================================
    // NEW ORDER NOTIFICATION
    // ==========================================

    const notifyNewOrder = (order) => {

        console.log(
            "🔔 NEW ORDER NOTIFICATION:",
            order
        );

        // ==========================================
        // PLAY DING SOUND
        // ==========================================

        if (notificationAudio.current) {

            notificationAudio.current.currentTime = 0;

            notificationAudio.current
                .play()
                .then(() => {

                    console.log(
                        "🔊 DING PLAYED"
                    );

                })
                .catch((err) => {

                    console.log(
                        "❌ DING BLOCKED:",
                        err
                    );

                });

        }

        // ==========================================
        // BROWSER NOTIFICATION
        // ==========================================

        if (
            notificationEnabled &&
            "Notification" in window &&
            Notification.permission === "granted"
        ) {

            const notification =
                new Notification(
                    "🔔 New Order Received!",
                    {
                        body:
                            `Order #${order.id} has been placed.`,
                        icon: "/favicon.svg",
                        requireInteraction: true
                    }
                );

            notification.onclick = () => {

                window.focus();

                notification.close();

            };

        }

    };

    // ==========================================
    // LOAD ORDERS
    // ==========================================

    const loadOrders = async () => {

        try {

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

            // ==========================================
            // NORMALIZE API RESPONSE
            // ==========================================

            const orderList =
                Array.isArray(res.data)

                    ? res.data

                    : Array.isArray(res.data.orders)

                        ? res.data.orders

                        : [];

            // ==========================================
            // FIND PENDING ORDERS
            // ==========================================

            const pendingOrders =
                orderList.filter(
                    order =>
                        order.order_status ===
                        "Pending"
                );

            // ==========================================
            // FIRST LOAD
            // ==========================================

            if (firstOrderLoad.current) {

                previousPendingIds.current =
                    new Set(
                        pendingOrders.map(
                            order => order.id
                        )
                    );

                firstOrderLoad.current = false;

                console.log(
                    "Initial pending orders loaded:",
                    pendingOrders.length
                );

            }

            // ==========================================
            // CHECK NEW PENDING ORDERS
            // ==========================================

            else {

                const previousIds =
                    previousPendingIds.current;

                const newOrders =
                    pendingOrders.filter(
                        order =>
                            !previousIds.has(
                                order.id
                            )
                    );

                console.log(
                    "🆕 NEW ORDERS:",
                    newOrders
                );

                // ======================================
                // NOTIFY EACH NEW ORDER
                // ======================================

                newOrders.forEach(
                    order => {

                        notifyNewOrder(
                            order
                        );

                    }
                );

                // ======================================
                // UPDATE PREVIOUS PENDING IDS
                // ======================================

                previousPendingIds.current =
                    new Set(
                        pendingOrders.map(
                            order => order.id
                        )
                    );

            }

            // ==========================================
            // UPDATE ORDERS
            // ==========================================

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

        const interval =
            setInterval(() => {

                loadOrders();

            }, 5000);

        return () => {

            clearInterval(
                interval
            );

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

            alert(
                "Order Accepted"
            );

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

            alert(
                "Order is now Preparing"
            );

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

            alert(
                "Order Ready"
            );

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

            alert(
                "Order Completed"
            );

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

        localStorage.removeItem(
            "staff"
        );

        window.location.href =
            "/staff-login";

    };

    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {

        return (

            <div className="staff-dashboard">

                <h1>
                    👨‍🍳 Staff Dashboard
                </h1>

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

            {/* ==================================
                HEADER
            ================================== */}

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

                {/* NOTIFICATION BUTTON */}

                <button
                    onClick={
                        enableNotifications
                    }
                >

                    {notificationEnabled

                        ? "🔔 Notifications On"

                        : "🔔 Enable Notifications"

                    }

                </button>

                {/* LOGOUT */}

                <button
                    onClick={logout}
                >

                    Logout

                </button>

            </div>

            {/* ==================================
                SUMMARY
            ================================== */}

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

            {/* ==================================
                ERROR
            ================================== */}

            {error && (

                <div className="staff-error">

                    ⚠️ {error}

                    <button
                        onClick={
                            loadOrders
                        }
                    >

                        Retry

                    </button>

                </div>

            )}

            {/* ==================================
                ORDERS
            ================================== */}

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

                    orders.map(
                        (order) => (

                            <div
                                className="order-card"
                                key={order.id}
                            >

                                {/* ORDER HEADER */}

                                <div className="order-header">

                                    <h2>
                                        Order #{order.id}
                                    </h2>

                                    <span>
                                        {
                                            order.order_status
                                        }
                                    </span>

                                </div>

                                {/* CUSTOMER */}

                                <p>

                                    <strong>
                                        Customer ID:
                                    </strong>{" "}

                                    {
                                        order.customer_id ||
                                        "-"
                                    }

                                </p>

                                {/* TABLE */}

                                <p>

                                    <strong>
                                        Table:
                                    </strong>{" "}

                                    {
                                        order.table_number ||
                                        "-"
                                    }

                                </p>

                                {/* ORDER TYPE */}

                                <p>

                                    <strong>
                                        Order Type:
                                    </strong>{" "}

                                    {
                                        order.order_type ||
                                        "-"
                                    }

                                </p>

                                {/* PAYMENT */}

                                <p>

                                    <strong>
                                        Payment:
                                    </strong>{" "}

                                    {
                                        order.payment_status ||
                                        "-"
                                    }

                                </p>

                                {/* TOTAL */}

                                <p>

                                    <strong>
                                        Total:
                                    </strong>{" "}

                                    ₹
                                    {
                                        order.total_amount ||
                                        0
                                    }

                                </p>

                                {/* ==================================
                                    ORDER ITEMS
                                ================================== */}

                                {
                                    Array.isArray(
                                        order.items
                                    ) &&
                                    order.items.length > 0 &&
                                    (

                                        <div className="order-items">

                                            <h3>
                                                Items
                                            </h3>

                                            <ul>

                                                {
                                                    order.items.map(
                                                        (
                                                            item,
                                                            index
                                                        ) => (

                                                            <li
                                                                key={
                                                                    index
                                                                }
                                                            >

                                                                {
                                                                    item.name ||
                                                                    item.item_name ||
                                                                    "Item"
                                                                }

                                                                {" × "}

                                                                {
                                                                    item.quantity
                                                                }

                                                            </li>

                                                        )
                                                    )
                                                }

                                            </ul>

                                        </div>

                                    )
                                }

                                {/* ==================================
                                    ACTIONS
                                ================================== */}

                                <div className="order-actions">

                                    {
                                        order.order_status ===
                                        "Pending" &&
                                        (

                                            <button
                                                onClick={() =>
                                                    acceptOrder(
                                                        order.id
                                                    )
                                                }
                                            >

                                                Accept Order

                                            </button>

                                        )
                                    }

                                    {
                                        order.order_status ===
                                        "Accepted" &&
                                        (

                                            <button
                                                onClick={() =>
                                                    startPreparing(
                                                        order.id
                                                    )
                                                }
                                            >

                                                Start Preparing

                                            </button>

                                        )
                                    }

                                    {
                                        order.order_status ===
                                        "Preparing" &&
                                        (

                                            <button
                                                onClick={() =>
                                                    markReady(
                                                        order.id
                                                    )
                                                }
                                            >

                                                Mark Ready

                                            </button>

                                        )
                                    }

                                    {
                                        order.order_status ===
                                        "Ready" &&
                                        (

                                            <button
                                                onClick={() =>
                                                    completeOrder(
                                                        order.id
                                                    )
                                                }
                                            >

                                                Complete Order

                                            </button>

                                        )
                                    }

                                    {/* WALK-IN */}

                                    <button
                                        onClick={() =>
                                            navigate(
                                                "/staff/walk-in"
                                            )
                                        }
                                    >

                                        🧓 Walk-in Customer

                                    </button>

                                    {/* COMPLETED */}

                                    {
                                        order.order_status ===
                                        "Completed" &&
                                        (

                                            <button
                                                disabled
                                            >

                                                ✔ Completed

                                            </button>

                                        )
                                    }

                                    {/* CANCELLED */}

                                    {
                                        order.order_status ===
                                        "Cancelled" &&
                                        (

                                            <button
                                                disabled
                                            >

                                                ❌ Cancelled

                                            </button>

                                        )
                                    }

                                </div>

                            </div>

                        )
                    )

                )}

            </div>

        </div>

    );

}

export default StaffDashboard;
