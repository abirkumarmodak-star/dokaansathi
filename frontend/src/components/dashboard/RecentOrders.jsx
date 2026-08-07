function RecentOrders({ orders }) {

    return (

        <div className="dashboard-box">

            <h2>📋 Recent Orders</h2>

            <table className="dashboard-table">

                <thead>

                    <tr>

                        <th>Token</th>

                        <th>Customer</th>

                        <th>Item</th>

                        <th>Amount</th>

                        <th>Status</th>

                    </tr>

                </thead>

                <tbody>

                    {

                        orders.map((order) => (

                            <tr key={order.id}>

                                <td>{order.token}</td>

                                <td>{order.customer}</td>

                                <td>{order.item}</td>

                                <td>₹ {order.amount}</td>

                                <td>

                                    {order.status === "Pending" && "🟡 Pending"}

                                    {order.status === "Preparing" && "🟠 Preparing"}

                                    {order.status === "Ready" && "🟢 Ready"}

                                    {order.status === "Completed" && "✅ Completed"}

                                </td>

                            </tr>

                        ))

                    }

                </tbody>

            </table>

        </div>

    );

}

export default RecentOrders;