function DashboardCard({ data }) {

    return (

        <div className="dashboard-cards">

            <div className="dashboard-card">

                <h3>💰 Today's Revenue</h3>

                <h2>₹ {data.totalRevenue}</h2>

            </div>

            <div className="dashboard-card">

                <h3>🛒 Today's Orders</h3>

                <h2>{data.totalOrders}</h2>

            </div>

            <div className="dashboard-card">

                <h3>🧾 Today's Bills</h3>

                <h2>{data.totalBills}</h2>

            </div>

            <div className="dashboard-card">

                <h3>📦 Low Stock Items</h3>

                <h2>{data.lowStock.length}</h2>

            </div>

        </div>

    );

}

export default DashboardCard;