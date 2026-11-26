
function OrderDetailsModal({ order, onClose }) {
    if (!order) return null;

    const formatDate = (value) => {
        if (!value) return "-";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) return value;

        return date.toLocaleString("en-IN", { timeZone: "Asia/Kolkata",
            dateStyle: "medium",
            timeStyle: "short"
        });
    };

    const money = (value) =>
        `₹${Number(value || 0).toFixed(2)}`;

    return (
        <div className="modal-overlay">
            <div
                className="modal"
                style={{
                    maxWidth: "720px",
                    width: "95%",
                    maxHeight: "85vh",
                    overflowY: "auto"
                }}
            >
                <h2>Order Details - #{order.id}</h2>
                <hr />

                <h3>Customer Information</h3>
                <p><strong>Customer:</strong> {order.customer}</p>
                <p><strong>Phone:</strong> {order.customerPhone || "-"}</p>
                <p><strong>Order Date:</strong> {formatDate(order.createdAt)}</p>

                <hr />

                <h3>Ordered Items</h3>

                {order.items?.length ? (
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr>
                                <th style={{ textAlign: "left" }}>Item</th>
                                <th>Qty</th>
                                <th>Price</th>
                                <th>Subtotal</th>
                            </tr>
                        </thead>

                        <tbody>
                            {order.items.map((item, index) => (
                                <tr key={item.id || index}>
                                    <td>{item.name}</td>
                                    <td style={{ textAlign: "center" }}>
                                        {item.quantity}
                                    </td>
                                    <td style={{ textAlign: "center" }}>
                                        {money(item.price)}
                                    </td>
                                    <td style={{ textAlign: "center" }}>
                                        {money(item.subtotal)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p>No item information available.</p>
                )}

                <hr />

                <h3>Order Information</h3>
                <p><strong>Order Type:</strong> {order.orderType || "-"}</p>
                <p><strong>Token:</strong> {order.token}</p>
                <p><strong>Table:</strong> {order.table || "-"}</p>
                <p><strong>Status:</strong> {order.status || "-"}</p>
                <p><strong>Instruction:</strong> {order.instruction || "-"}</p>

                <hr />

                <h3>Payment Information</h3>
                <p><strong>Food + Order Total:</strong> {money(order.total)}</p>
                <p><strong>Delivery Fee:</strong> {money(order.deliveryFee)}</p>
                <p><strong>Payment Method:</strong> {order.paymentMethod || "-"}</p>
                <p><strong>Payment Status:</strong> {order.payment || "-"}</p>

                <hr />

                <h3>Delivery Information</h3>
                <p><strong>Address:</strong> {order.deliveryAddress || "-"}</p>
                <p><strong>Landmark:</strong> {order.deliveryLandmark || "-"}</p>
                <p><strong>Delivery Boy:</strong> {order.deliveryBoyName || "-"}</p>
                <p><strong>Delivery Boy ID:</strong> {order.deliveryBoyId || "-"}</p>
                <p><strong>Delivery Status:</strong> {order.deliveryStatus || "-"}</p>
                <p><strong>Assigned At:</strong> {formatDate(order.assignedAt)}</p>

                <button onClick={onClose}>Close</button>
            </div>
        </div>
    );
}

export default OrderDetailsModal;
