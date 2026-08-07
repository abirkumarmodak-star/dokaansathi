import OrderStatusBadge from "./OrderStatusBadge";

function OrderTable({

    orders,
    onView,
    onStatusChange

}) {

    const getButtonText = (status) => {

        switch (status) {

            case "New":
                return "Accept";

            case "Preparing":
                return "Food Ready";

            case "Ready":
                return "Complete";

            case "Completed":
                return "Completed";

            default:
                return "-";
        }

    };

    return (

        <div className="table-container">

            <table className="order-table">

                <thead>

                    <tr>

                        <th>Token</th>
                        <th>Customer</th>
                        <th>Items</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Action</th>

                    </tr>

                </thead>

                <tbody>

                    {

                        orders.map((order) => (

                            <tr key={order.id}>

                                <td>{order.token}</td>

                                <td>{order.customer}</td>

                                <td>{order.items}</td>

                                <td>₹{order.total}</td>

                                <td>

                                    <OrderStatusBadge

                                        status={order.status}

                                    />

                                </td>

                                <td>

                                    <button

                                        className="status-action-btn"

                                        disabled={

                                            order.status === "Completed"

                                        }

                                        onClick={() =>

                                            onStatusChange(order.id)

                                        }

                                    >

                                        {

                                            getButtonText(

                                                order.status

                                            )

                                        }

                                    </button>

                                    <button

                                        className="view-btn"

                                        onClick={() =>

                                            onView(order)

                                        }

                                    >

                                        👁 View

                                    </button>

                                </td>

                            </tr>

                        ))

                    }

                </tbody>

            </table>

        </div>

    );

}

export default OrderTable;

