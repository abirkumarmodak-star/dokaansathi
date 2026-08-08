import { useEffect, useState } from "react";
import "./Payment.css";

function Payment() {

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // ==========================
    // LOAD PAYMENTS
    // ==========================

    const loadPayments = async () => {

        try {

            const response = await fetch(
                "https://dokaansathi.onrender.com/api/orders/pending-payment"
            );

            const data = await response.json();

            console.log("FULL RESPONSE :", data);
            console.log("Pending Payments :", data.pendingPayments);
            console.log("Is Array :", Array.isArray(data.pendingPayments));

            setOrders(data.pendingPayments || []);

        }

        catch (err) {

            console.log(err);

            setOrders([]);

        }

        finally {

            setLoading(false);

        }

    };

    useEffect(() => {

        loadPayments();

    }, []);

    // ==========================
    // RECEIVE PAYMENT
    // ==========================

    const receivePayment = async (order) => {

        try {

            const response = await fetch(

                "https://dokaansathi.onrender.com/api/orders/payment",

                {

                    method: "PUT",

                    headers: {

                        "Content-Type": "application/json"

                    },

                    body: JSON.stringify({

                        order_id: order.id,

                        payment_method: order.payment_method || "Cash"

                    })

                }

            );

            const result = await response.json();

            alert(result.message);

            loadPayments();

        }

        catch (err) {

            console.log(err);

            alert("Server Error");

        }

    };

    // ==========================
    // LOADING
    // ==========================

    if (loading) {

        return <h2>Loading...</h2>;

    }

    console.log("Orders State :", orders);
    console.log("Is Orders Array :", Array.isArray(orders));

    return (

        <div className="payment-page">

            <h1>💳 Payment Management</h1>

            <hr />

            <h2>

                Pending Payments : {orders.length}

            </h2>

            {

                orders.length === 0 ?

                    (

                        <h3>

                            ✅ No Pending Payments

                        </h3>

                    )

                    :

                    (

                        <table

                            border="1"

                            cellPadding="10"

                            style={{

                                width: "100%",

                                borderCollapse: "collapse"

                            }}

                        >

                            <thead>

                                <tr>

                                    <th>Order ID</th>

                                    <th>Customer</th>

                                    <th>Total</th>

                                    <th>Status</th>

                                    <th>Payment</th>

                                    <th>Action</th>

                                </tr>

                            </thead>

                            <tbody>

                                {

                                    orders.map((order) => (

                                        <tr key={order.id}>

                                            <td>{order.id}</td>

                                            <td>{order.customer_name || "Guest"}</td>

                                            <td>₹{order.total_amount}</td>

                                            <td>{order.order_status}</td>

                                            <td>{order.payment_method || "Cash"}</td>

                                            <td>
{
    order.payment_status === "Pending" ? (

        order.order_status === "Completed" ? (

            <button
                onClick={() => receivePayment(order)}
            >
                Receive Payment
            </button>

        ) : (

            <span>Order Not Completed</span>

        )

    ) : (

        <span>Paid</span>

    )
}
</td>

                                        </tr>

                                    ))

                                }

                            </tbody>

                        </table>

                    )

            }

        </div>

    );

}

export default Payment;
