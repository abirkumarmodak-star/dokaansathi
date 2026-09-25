import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./OrderTracking.css";

function OrderTracking() {
    const navigate = useNavigate();

    const [token, setToken] = useState("");
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const statusSteps = [
        { name: "Pending", label: "📝 Order Placed" },
        { name: "Accepted", label: "👨‍🍳 Order Accepted" },
        { name: "Preparing", label: "🍳 Preparing" },
        { name: "Ready", label: "🔔 Order Ready" },
        { name: "Completed", label: "🎉 Completed" }
    ];

    // ==========================================
    // LOAD ORDER
    // ==========================================
    const trackOrder = useCallback(async () => {
        if (!token) return;

        try {
            const response = await fetch(
                `http://localhost:5000/api/orders/token/${token}`
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to load order");
            }

            setOrder(data.order);
            setError("");

        } catch (err) {
            console.log("TRACK ORDER ERROR:", err);
            setError(err.message || "Failed to load order");
        }
    }, [token]);

    // ==========================================
    // FIRST LOAD + AUTO REFRESH EVERY 5 SECONDS
    // ==========================================
    useEffect(() => {
        if (!token) return;

        // Load immediately
        trackOrder();

        // Then refresh every 5 seconds
        const interval = setInterval(() => {
            trackOrder();
        }, 5000);

        return () => {
            clearInterval(interval);
        };

    }, [token, trackOrder]);

    // ==========================================
    // CANCEL ORDER
    // ==========================================
    const cancelOrder = async () => {
        if (!order) return;

        try {
            const response = await fetch(
                "http://localhost:5000/api/orders/cancel",
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        order_id: order.id
                    })
                }
            );

            const data = await response.json();

            alert(data.message);

            if (response.ok) {
                trackOrder();
            }

        } catch (err) {
            console.log(err);
            alert("Cancel Failed");
        }
    };

    // ==========================================
    // DELIVERY STATUS
    // ==========================================
    const getDeliveryStatusLabel = () => {
        if (!order?.delivery_status) return null;

        const labels = {
            Assigned: "🚴 Delivery Boy Assigned",
            Accepted: "🚴 Delivery Accepted",
            PickedUp: "📦 Order Picked Up",
            OutForDelivery: "🛵 Out for Delivery",
            Delivered: "🏠 Delivered",
            Cancelled: "❌ Delivery Cancelled"
        };

        return labels[order.delivery_status] || order.delivery_status;
    };

    return (
        <div className="order-tracking">

            <h1>📦 Order Tracking</h1>

            {/* TOKEN SEARCH */}
            <div>
                <input
                    type="text"
                    placeholder="Enter Token Number"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                />

                <button onClick={trackOrder}>
                    Track Order
                </button>
            </div>

            {loading && <h3>Loading...</h3>}

            {error && <h3>{error}</h3>}

            {order && (
                <div className="order-card">

                    <h2>🎫 Token: {order.token_number}</h2>

                    <p>
                        Customer: {order.customer_name}
                    </p>

                    <p>
                        Amount: ₹{order.total_amount}
                    </p>

                    <p>
                        Payment: {order.payment_status}
                    </p>
{/* ==================================
    💰 PENDING CANCELLATION CASH
================================== */}

{Number(order.pending_cancellation_amount) > 0 && (
    <div
        style={{
            marginTop: "15px",
            padding: "15px",
            background: "#fff3cd",
            border: "1px solid #ffc107",
            borderRadius: "10px"
        }}
    >
        <h3>
            💰 You have ₹
            {Number(
                order.pending_cancellation_amount
            ).toFixed(2)}
            {" "}pending from your previous cancelled order.
        </h3>

        <p>
            This amount will be given to you in cash by the Delivery Boy.
        </p>
    </div>
)}
                    {/* ==================================
                        NORMAL ORDER STATUS
                    ================================== */}
                    <h2>Current Order Status:</h2>

                    <div className="timeline">

                        {statusSteps.map((step, index) => {

                            const currentIndex =
                                statusSteps.findIndex(
                                    item => item.name === order.order_status
                                );

                            return (
                                <div key={step.name}>

                                    {index <= currentIndex ? (
                                        <h3>{step.label}</h3>
                                    ) : (
                                        <h3>⬜ {step.name}</h3>
                                    )}

                                </div>
                            );
                        })}

                    </div>

                    {/* ==================================
                        DELIVERY STATUS
                    ================================== */}
                    {order.order_type === "Delivery" && (
                        <div
                            style={{
                                marginTop: "20px",
                                padding: "15px",
                                border: "1px solid #ddd",
                                borderRadius: "10px"
                            }}
                        >

                            <h2>🚴 Delivery Status</h2>

                            {order.delivery_status ? (
                                <h3>
                                    {getDeliveryStatusLabel()}
                                </h3>
                            ) : (
                                <h3>
                                    ⏳ Waiting for Delivery Assignment
                                </h3>
                            )}

                        </div>
                    )}

                    {/* ==================================
                        DELIVERY ADDRESS
                    ================================== */}
                    {order.order_type === "Delivery" && (
                        <div style={{ marginTop: "15px" }}>

                            <p>
                                📍 Delivery Address:
                                <br />
                                {order.delivery_address}
                            </p>

                            {order.delivery_landmark && (
                                <p>
                                    🏷️ Landmark:
                                    <br />
                                    {order.delivery_landmark}
                                </p>
                            )}

                        </div>
                    )}

                   {/* ==================================
    CANCEL
================================== */}
{(
    // Normal order
    (
        order.order_type !== "Delivery" &&
        order.order_status === "Pending"
    )

    ||

    // Delivery order
    (
        order.order_type === "Delivery" &&
        (
            order.delivery_status === "Accepted" ||
            order.delivery_status === "PickedUp"
        )
    )
) && (
    <div style={{ marginTop: "15px" }}>
        <button onClick={cancelOrder}>
            ❌ Cancel Order
        </button>
    </div>
)}
                </div>
            )}

        </div>
    );
}

export default OrderTracking;