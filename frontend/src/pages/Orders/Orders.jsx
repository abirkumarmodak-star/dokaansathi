import { useEffect, useState } from "react";

import "./Orders.css";

import OrderCard from "../../components/Orders/OrderCard";
import OrderFilter from "../../components/Orders/Orderfilter";
import OrderTable from "../../components/Orders/OrderTable";
import OrderDetailsModal from "../../components/Orders/OrderDetailsModal";

function Orders() {

    // ==========================
    // STATES
    // ==========================

    const [orders, setOrders] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [search, setSearch] = useState("");

    const [statusFilter, setStatusFilter] = useState("All");

    const [selectedOrder, setSelectedOrder] = useState(null);

    // ==========================
    // LOAD ORDERS
    // ==========================

    const fetchOrders = async () => {

        try {

            const response = await fetch(
                "https://dokaansathi.onrender.com/api/orders"
            );

            if (!response.ok) {

                throw new Error("Failed to fetch orders");

            }

         const data = await response.json();

console.log("ORDERS API RESPONSE:", data);

const orderList = Array.isArray(data)
    ? data
    : Array.isArray(data.orders)
        ? data.orders
        : [];

const formattedOrders = orderList.map((order) => ({

                id: order.id,

                customer: order.customer_name || `Customer ${order.customer_id}`,

                token: `#${order.id}`,

                total: Number(order.total_amount),

                status: order.order_status,

                table: order.table_number,

                payment: order.payment_status,

                instruction: order.special_instruction

            }));

            setOrders(formattedOrders);

            setLoading(false);

        }

        catch (err) {

            console.log(err);

            setError("Cannot connect to backend");

            setLoading(false);

        }

    };

    useEffect(() => {

        fetchOrders();

    }, []);
    // ==========================
    // CHANGE ORDER STATUS
    // ==========================

    const handleStatusChange = async (id, currentStatus) => {

        try {

            let api = "";

            if (currentStatus === "Pending") {

                api = "accept";

            }

            else if (currentStatus === "Preparing") {

                api = "ready";

            }

            else if (currentStatus === "Ready") {

                api = "complete";

            }

            else {

                alert("Order Already completed");

                return;

            }

            const response = await fetch(

                `https://dokaansathi.onrender.com/api/orders/${api}`,

                {

                    method: "POST",

                    headers: {

                        "Content-Type": "application/json"

                    },

                    body: JSON.stringify({

                        order_id: id

                    })

                }

            );

            const data = await response.json();

            if (!response.ok) {

                alert(data.message);

                return;

            }

            alert(data.message);

            fetchOrders();

        }

        catch (err) {

            console.log(err);

            alert("Server Error");

        }

    };

    // ==========================
    // SEARCH + FILTER
    // ==========================

    const filteredOrders = orders.filter((order) => {

        const matchSearch =

            order.customer
                .toLowerCase()
                .includes(search.toLowerCase())

            ||

            order.token
                .toLowerCase()
                .includes(search.toLowerCase());

        const matchStatus =

            statusFilter === "All"

                ? true

                : order.status === statusFilter;

        return matchSearch && matchStatus;

    });

    // ==========================
    // LOADING
    // ==========================

    if (loading) {

        return <h2>Loading Orders...</h2>;

    }

    // ==========================
    // ERROR
    // ==========================

    if (error) {

        return <h2>{error}</h2>;

    }

    // ==========================
    // UI
    // ==========================

    return (

        <div className="orders-page">

            <h1>📋 Order Management</h1>

            <OrderCard orders={orders} />

            <OrderFilter

                search={search}

                setSearch={setSearch}

                statusFilter={statusFilter}

                setStatusFilter={setStatusFilter}

            />

            <OrderTable

                orders={filteredOrders}

                onView={setSelectedOrder}

                onStatusChange={(id) => {

                    const order = orders.find(o => o.id === id);

                    handleStatusChange(id, order.status);

                }}

            />

            {

                selectedOrder &&

                (

                    <OrderDetailsModal

                        order={selectedOrder}

                        onClose={() => setSelectedOrder(null)}

                    />

                )

            }

        </div>

    );

}

export default Orders;

