import { useEffect, useState } from "react";
import apiClient from "../../Services/api";

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

    const [canDeleteOrders] = useState(() => {
        try {
            const owner = JSON.parse(localStorage.getItem("user") || "null");
            const staff = JSON.parse(localStorage.getItem("staffUser") || localStorage.getItem("staff") || "null");
            return owner?.role === "Owner" || staff?.role === "Manager";
        } catch {
            return false;
        }
    });

    // ==========================
    // LOAD ORDERS
    // ==========================

    const fetchOrders = async () => {

        try {

            const response = await apiClient.get(
                "/orders",
                {
                    validateStatus: () => true,
                    transformResponse: [(data) => data],
                    headers: { "Content-Type": null, Accept: "*/*" },
                }
            );

            if (response.status < 200 || response.status >= 300) {

                throw new Error("Failed to fetch orders");

            }

         const data = JSON.parse(response.data);

console.log("ORDERS API RESPONSE:", data);

const orderList = Array.isArray(data)
    ? data
    : Array.isArray(data.orders)
        ? data.orders
        : [];
const formattedOrders = orderList.map((order) => ({
    id: order.id,

    customer: order.customer_name || `Customer ${order.customer_id}`,
    customerPhone: order.customer_phone || "",

    token: `#${order.id}`,
    total: Number(order.total_amount || 0),

    status: order.order_status,
    orderType: order.order_type || "",

    table: order.table_number,

    payment: order.payment_status || "",
    paymentMethod: order.payment_method || "",

    instruction: order.special_instruction || "",

    items: Array.isArray(order.items)
        ? order.items.map((item) => ({
            ...item,
            name: item.name || item.item_name || "Unknown Item",
            quantity: Number(item.quantity || 0),
            price: Number(item.price || 0),
            subtotal: Number(
                item.subtotal ??
                (Number(item.price || 0) * Number(item.quantity || 0))
            )
        }))
        : [],

    deliveryAddress:
        order.delivery_address ||
        order.customer_saved_address ||
        "",

    deliveryLandmark: order.delivery_landmark || "",
    deliveryFee: Number(order.delivery_fee || 0),

    deliveryBoyName: order.delivery_boy_name || "",
    deliveryBoyId: order.delivery_boy_id || "",
    deliveryStatus: order.delivery_status || "",
    assignedAt: order.assigned_at || "",

    createdAt:
        order.created_at ||
        order.order_date ||
        order.order_time ||
        ""
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

            const response = await apiClient.post(
                `/orders/${api}`,
                JSON.stringify({

                        order_id: id

                    }),
                {
                    validateStatus: () => true,
                    transformResponse: [(data) => data],
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "*/*"
                    },
                }
            );

            const data = JSON.parse(response.data);

            if (response.status < 200 || response.status >= 300) {

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
    // SOFT DELETE ORDER
    const handleDeleteOrder = async (id) => {
        if (!canDeleteOrders) return;
        if (!window.confirm("Are you sure you want to delete this order?")) return;

        try {
            const response = await apiClient.delete(`/orders/${id}`);
            const data = response.data;

            setOrders(previous => previous.filter(order => order.id !== id));

            if (selectedOrder?.id === id) setSelectedOrder(null);

            alert(data?.message || "Order deleted successfully");
        } catch (err) {
            console.log(err);
            alert(err.response?.data?.message || "Failed to delete order");
        }
    };

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
                canDelete={canDeleteOrders}
                onDelete={handleDeleteOrder}

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

