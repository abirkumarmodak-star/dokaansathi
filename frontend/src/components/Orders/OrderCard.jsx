function OrderCard({ orders }) {

    const totalOrders = orders.length;

    const pendingOrders = orders.filter(
        (order) => order.status === "Pending"
    ).length;

    const preparingOrders = orders.filter(
        (order) => order.status === "Preparing"
    ).length;

    const readyOrders = orders.filter(
        (order) => order.status === "Ready"
    ).length;

    const servedOrders = orders.filter(
        (order) => order.status === "Served"
    ).length;

    return (

        <div className="order-cards">

            <div className="order-card">

                <h3>Total Orders</h3>

                <h2>{totalOrders}</h2>

            </div>

            <div className="order-card pending">

                <h3>Pending</h3>

                <h2>{pendingOrders}</h2>

            </div>

            <div className="order-card preparing">

                <h3>Preparing</h3>

                <h2>{preparingOrders}</h2>

            </div>

            <div className="order-card ready">

                <h3>Ready</h3>

                <h2>{readyOrders}</h2>

            </div>

            <div className="order-card served">

                <h3>Served</h3>

                <h2>{servedOrders}</h2>

            </div>

        </div>

    );

}

export default OrderCard;