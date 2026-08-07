import React, {
    useEffect,
    useState,
    useRef
} from "react";

import axios from "axios";

import "./OwnerOrders.css";


function OwnerOrders() {

    // =====================================
    // NEW ORDER DETECTION
    // =====================================

    const previousPending = useRef(-1);

  const audioRef = useRef(null);
    // =====================================
    // ORDERS
    // =====================================

    const [orders, setOrders] = useState([]);


    // =====================================
    // LOADING
    // =====================================

    const [loading, setLoading] = useState(true);


    // =====================================
    // LOAD ORDERS
    // =====================================

    const loadOrders = async () => {

        try {

            const response = await axios.get(
                "http://localhost:5000/api/orders"
            );


            const newOrders =
                response.data.orders;


            // =================================
            // FIND PENDING ORDERS
            // =================================

            const pendingOrders =
                newOrders.filter(
                    order =>
                        order.order_status === "Pending"
                );


            // =================================
            // FIRST LOAD
            // =================================

            if (
                previousPending.current === -1
            ) {

                previousPending.current =
                    pendingOrders.length;

            }


            // =================================
            // NEW PENDING ORDER
            // =================================

            else if (
                pendingOrders.length >
                previousPending.current
            ) {

                if (audioRef.current) {

    audioRef.current.currentTime = 0;

    audioRef.current.play()
        .then(() => {

            console.log(
                "🔔 New Order Notification Played"
            );

        })
        .catch(error => {

            console.log(
                "❌ Notification Sound Error:",
                error
            );

        });

}



                previousPending.current =
                    pendingOrders.length;

            }


            // =================================
            // UPDATE PENDING COUNT
            // =================================

            else {

                previousPending.current =
                    pendingOrders.length;

            }


            // =================================
            // SAVE ORDERS
            // =================================

            setOrders(newOrders);


            setLoading(false);

        }

        catch (error) {

            console.log(
                "ORDER FETCH ERROR:",
                error
            );


            setLoading(false);

        }

    };


    // =====================================
    // LOAD ORDERS WHEN PAGE OPENS
    // =====================================

    useEffect(() => {

        loadOrders();


        // =================================
        // AUTO REFRESH EVERY 5 SECONDS
        // =================================

        const interval =
            setInterval(() => {

                loadOrders();

            }, 5000);


        // =================================
        // CLEANUP
        // =================================

        return () => {

            clearInterval(interval);

        };

    }, []);


    // =====================================
    // NEXT PART
    // =====================================
    // =====================================
    // UPDATE ORDER STATUS
    // =====================================

    const updateOrderStatus = async (
        endpoint,
        order_id
    ) => {

        try {

            const response = await axios.post(

                `http://localhost:5000/api/orders/${endpoint}`,

                {
                    order_id: order_id
                }

            );


            // =================================
            // SUCCESS MESSAGE
            // =================================

            alert(
                response.data.message
            );


            // =================================
            // RELOAD ORDERS
            // =================================

            await loadOrders();

        }

        catch (error) {

            console.log(
                "STATUS UPDATE ERROR:",
                error
            );


            // =================================
            // BACKEND ERROR
            // =================================

            if (error.response) {

                alert(
                    error.response.data.message ||
                    "Failed to update order"
                );

            }

            else {

                alert(
                    "Server connection failed"
                );

            }

        }

    };
        // =====================================
    // ACCEPT ALL PENDING ORDERS
    // =====================================

    const acceptAllOrders = async () => {

        try {

            const response = await axios.put(
                "http://localhost:5000/api/orders/accept-all"
            );


            // =================================
            // SUCCESS MESSAGE
            // =================================

            alert(
                response.data.message
            );


            // =================================
            // RELOAD ORDERS
            // =================================

            await loadOrders();

        }

        catch (error) {

            console.log(
                "ACCEPT ALL ERROR:",
                error
            );


            // =================================
            // BACKEND ERROR
            // =================================

            if (error.response) {

                alert(
                    error.response.data.message ||
                    "Failed To Accept All Orders"
                );

            }

            else {

                alert(
                    "Server connection failed"
                );

            }

        }

    };
        // =====================================
    // TEST NOTIFICATION SOUND
    // =====================================
const testNotificationSound = () => {

    if (!audioRef.current) {

        console.log(
            "❌ Audio element not ready"
        );

        return;

    }

    audioRef.current.currentTime = 0;

    audioRef.current.play()

        .then(() => {

            console.log(
                "✅ Test Sound Played"
            );

        })

        .catch(error => {

            console.log(
                "❌ Test Sound Error:",
                error
            );

        });

};

       
        // =====================================
    // LOADING SCREEN
    // =====================================

    if (loading) {

        return (

            <h2>
                Loading Orders...
            </h2>

        );

    }


    // =====================================
    // MAIN UI
    // =====================================

    return (

        <div className="owner-orders">

<audio
    ref={audioRef}
    src="/notification.mp3"
    preload="auto"
/>
            {/* =================================
                PAGE TITLE
            ================================= */}

            <h1>
                🍽 Order Management
            </h1>


            {/* =================================
                TEST SOUND
            ================================= */}

            <button
                onClick={testNotificationSound}
            >
                🔔 Test Sound
            </button>


            {/* =================================
                ACCEPT ALL
            ================================= */}

            <button
                className="accept-all-btn"
                onClick={acceptAllOrders}
            >
                ✅ Accept All Pending
            </button>


            {/* =================================
                NO ORDERS
            ================================= */}

            {
                orders.length === 0 ? (

                    <h2>
                        No Orders Available
                    </h2>

                ) : (


                    /* =================================
                       ORDER LIST
                    ================================= */

                    orders.map((order) => (

                        <div
                            className="order-card"
                            key={order.id}
                        >


                            {/* =========================
                                TOKEN
                            ========================= */}

                            <h2>

                                🎫 Token :

                                {" "}

                                {order.token_number || "N/A"}

                            </h2>


                            {/* =========================
                                CUSTOMER
                            ========================= */}

                            <p>

                                <b>
                                    Customer:
                                </b>

                                {" "}

                                {order.customer_name || "Guest"}

                            </p>


                            {/* =========================
                                PHONE
                            ========================= */}

                            <p>

                                <b>
                                    Phone:
                                </b>

                                {" "}

                                {order.phone || "N/A"}

                            </p>


                            {/* =========================
                                AMOUNT
                            ========================= */}

                            <p>

                                <b>
                                    Amount:
                                </b>

                                {" "}

                                ₹{order.total_amount}

                            </p>


                            {/* =========================
                                PAYMENT
                            ========================= */}

                            <p>

                                <b>
                                    Payment:
                                </b>

                                {" "}

                                {order.payment_status}

                            </p>


                            {/* =========================
                                STATUS
                            ========================= */}

                            <p>

                                <b>
                                    Status:
                                </b>

                                {" "}

                                <span className="status">

                                    {order.order_status}

                                </span>

                            </p>


                            {/* =================================
                                PENDING → ACCEPTED
                            ================================= */}

                            {
                                order.order_status === "Pending" && (

                                    <button
                                        className="accept-btn"
                                        onClick={() =>
                                            updateOrderStatus(
                                                "accept",
                                                order.id
                                            )
                                        }
                                    >

                                        ✅ Accept Order

                                    </button>

                                )
                            }


                            {/* =================================
                                ACCEPTED → PREPARING
                            ================================= */}

                            {
                                order.order_status === "Accepted" && (

                                    <button
                                        className="prepare-btn"
                                        onClick={() =>
                                            updateOrderStatus(
                                                "preparing",
                                                order.id
                                            )
                                        }
                                    >

                                        🍳 Start Preparing

                                    </button>

                                )
                            }


                            {/* =================================
                                PREPARING → READY
                            ================================= */}

                            {
                                order.order_status === "Preparing" && (

                                    <button
                                        className="ready-btn"
                                        onClick={() =>
                                            updateOrderStatus(
                                                "ready",
                                                order.id
                                            )
                                        }
                                    >

                                        🔔 Mark Ready

                                    </button>

                                )
                            }


                            {/* =================================
                                READY → COMPLETED
                            ================================= */}

                            {
                                order.order_status === "Ready" && (

                                    <button
                                        className="complete-btn"
                                        onClick={() =>
                                            updateOrderStatus(
                                                "complete",
                                                order.id
                                            )
                                        }
                                    >

                                        🎉 Complete Order

                                    </button>

                                )
                            }


                        </div>

                    ))

                )

            }


        </div>

    );

}


export default OwnerOrders;







    