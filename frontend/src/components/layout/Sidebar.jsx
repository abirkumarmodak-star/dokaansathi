import "./Sidebar.css";
import { Link } from "react-router-dom";

function Sidebar() {
    const canViewReports = (() => {
        try {
            const owner = JSON.parse(localStorage.getItem("user") || "null");
            const staff = JSON.parse(localStorage.getItem("staffUser") || localStorage.getItem("staff") || "null");
            return owner?.role === "Owner" || staff?.role === "Manager";
        } catch {
            return false;
        }
    })();
    return (
        <div className="sidebar">

            <h2 className="logo">
                🍽️ DOKAAN SATHI
            </h2>

            <ul>

                <li>
                    <Link to="/dashboard">
                        📊 Dashboard
                    </Link>
                </li>

                <li>
                    <Link to="/orders">
                        🛒 Orders
                    </Link>
                </li>

                <li>
                    <Link to="/menu">
                        📋 Menu
                    </Link>
                </li>

                <li>
                    <Link to="/inventory">
                        📦 Inventory
                    </Link>
                </li>

                <li>
                    <Link to="/billing">
                        🧾 Billing
                    </Link>
                </li>

                <li>
                    <Link to="/payment">
                        💳 Payment
                    </Link>
                </li>

                <li>
                    <Link to="/staff">
                        👥 Staff
                    </Link>
                </li>

                {canViewReports && (
        <li>
            <Link to="/reports">?? Reports</Link>
        </li>
    )}

                <li>
                    <Link to="/settings">
                        ⚙️ Settings
                    </Link>
                </li>

            </ul>

        </div>
    );
}

export default Sidebar;