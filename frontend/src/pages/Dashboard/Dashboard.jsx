import { useEffect, useState } from "react";
import Sidebar from "../../components/layout/Sidebar";
function Dashboard() {

    const [dashboard, setDashboard] = useState(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    useEffect(() => {

        fetch("https://dokaansathi.onrender.com/api/dashboard")

            .then((res) => res.json())

            .then((data) => {

                setDashboard(data.dashboard);

                setLoading(false);

            })
.then((data) => {

    console.log("Dashboard API:", data);

    setDashboard(data.dashboard);

    setLoading(false);

})
            .catch((err) => {

                console.log(err);

                setError("Dashboard Load Failed");

                setLoading(false);

            });

    }, []);

    if (loading) {

        return <h2>Loading Dashboard...</h2>;

    }

    if (error) {

        return <h2>{error}</h2>;

    }
console.log("Dashboard State:", dashboard);
    return (

    <div
        style={{
            display: "flex"
        }}
    >

        <Sidebar />

        <div
            style={{
                flex: 1,
                padding: "30px"
            }}
        >

            <h1>📊 DokaanSathi Dashboard</h1>

            <hr />

            <h3>
                💰 Revenue :
                ₹ {dashboard["মোট বিক্রয় (₹)"]}
            </h3>

            <h3>
                🛒 Orders :
                {dashboard["মোট অর্ডার"]}
            </h3>

            <h3>
                🍽 Menu :
                {dashboard["মোট মেনু"]}
            </h3>

            <h3>
                ⚠ Low Stock :
                {dashboard["কম স্টকের পণ্য"]}
            </h3>

            <hr />

            <h3>
                📋 Pending :
                {dashboard["অপেক্ষমান অর্ডার"]}
            </h3>

            <h3>
                👨‍🍳 Preparing :
                {dashboard["রান্না হচ্ছে"]}
            </h3>

            <h3>
                ✅ Ready :
                {dashboard["প্রস্তুত"]}
            </h3>

            <h3>
                🍽 Served :
                {dashboard["পরিবেশন সম্পন্ন"]}
            </h3>

        </div>

    </div>

);

}

export default Dashboard;

