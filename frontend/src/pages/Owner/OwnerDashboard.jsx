import { useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import axios from "axios";
import "./OwnerDashboard.css";

function OwnerDashboard() {
const navigate = useNavigate();
const [dashboard, setDashboard] = useState({});
const [inventory, setInventory] = useState([]);
const loadDashboard = async () => {

    try {

        const res = await axios.get(
            "http://localhost:5000/api/dashboard"
        );

        console.log(res.data);

        setDashboard(res.data.dashboard);

    }

    catch (err) {

        console.log(err);

    }

};
const loadInventory = async () => {

    try {

        const res = await axios.get(
            "http://localhost:5000/api/inventory"
        );

        setInventory(res.data);

    }

    catch (err) {

        console.log(err);

    }

};
useEffect(() => {

    loadDashboard();

    loadInventory();

}, []);
    return (
        <div className="owner-dashboard">

            <aside className="sidebar">
                <h2>DokaanSathi AI</h2>

                <ul>
                    <li>🏠 Dashboard</li>
                    <li>🍽 Orders</li>
                    <li>🍔 Menu</li>
                    <li>📦 Inventory</li>
                    <li>👥 Customers</li>
                    <li>💰 Billing</li>
                    <li>📊 Reports</li>
                    <li>⚙ Settings</li>
                    <li>🚪 Logout</li>
                </ul>
            </aside>

            <main className="content">

                <h1>Owner Dashboard</h1>

                <p>Welcome, Owner 👋</p>

                <div className="cards">

                    <div className="card">
                        <h3>Today's Sales</h3>
                        <h2>₹{dashboard["মোট বিক্রয় (₹)"] || 0}</h2>
                    </div>

                    <div className="card">
                        <h3>Total Orders</h3>
                       <h2>{dashboard["মোট অর্ডার"] || 0}</h2>
                    </div>

                    <div className="card">
                        <h3>Total Customers</h3>
                       <h2>Coming Soon</h2>
                    </div>

                    <div className="card">
                        <h3>Pending Orders</h3>
                        <h2>{dashboard["অপেক্ষমান অর্ডার"] || 0}</h2>
                    </div>

                    <div className="card">
                        <h3>Preparing Orders</h3>
                      <h2>{dashboard["রান্না হচ্ছে"] || 0}</h2>
                    </div>

                    <div className="card">
                        <h3>Ready Orders</h3>
                        <h2>{dashboard["প্রস্তুত"] || 0}</h2>
                    </div>

                    <div className="card">
                        <h3>Completed Orders</h3>
                       <h2>{dashboard["পরিবেশন সম্পন্ন"] || 0}</h2>
                    </div>

                    <div className="card">
                        <h3>Low Stock Items</h3>
                        <h2>{dashboard["কম স্টকের পণ্য"] || 0}</h2>
                    </div>

                </div>

                <div className="quick-actions">

                    <button>Orders</button>

                    <button>Menu</button>

                    <button>Inventory</button>

                    <button>Customers</button>

                    <button>Billing</button>

                    <button>Reports</button>

                </div>
                <h2>📦 Current Inventory</h2>

<div className="cards">

    {

        inventory.map((item) => (

            <div className="card" key={item.menu_id}>

                <h3>{item.name}</h3>

                <h2>{item.current_stock}</h2>

                <p>Reorder : {item.reorder_level}</p>

            </div>

        ))

    }

</div>
<button
onClick={() => navigate("/owner/orders")}
>
Orders
</button>
            </main>

        </div>
    );
}

export default OwnerDashboard;