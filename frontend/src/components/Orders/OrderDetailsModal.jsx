function OrderDetailsModal({ order, onClose }) {

    if (!order) return null;

    return (
        <div className="modal-overlay">

            <div className="modal">

                <h2>Order Details</h2>

                <hr />

                <p><strong>Order ID:</strong> {order.id}</p>

                <p><strong>Customer:</strong> {order.customer}</p>

                <p><strong>Food:</strong> {order.item}</p>

                <p><strong>Quantity:</strong> {order.quantity}</p>

                <p><strong>Amount:</strong> ₹{order.amount}</p>

                <p><strong>Status:</strong> {order.status}</p>

                <button onClick={onClose}>
                    Close
                </button>

            </div>

        </div>
    );
}

export default OrderDetailsModal;