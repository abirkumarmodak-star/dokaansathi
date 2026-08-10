import "./Sidebar.css";
import { Link } from "react-router-dom";

function Sidebar() {
  return (
    <div className="sidebar">

      <h2 className="logo">
        🍽️ DOKAAN SATHI
      </h2>

      <ul>

        <li>
          <Link to="/dashboard">📊 Dashboard</Link>
        </li>

        <li>
          <Link to="/orders">🛒 Orders</Link>
        </li>

        <li>
          <Link to="/menu">📋 Menu</Link>
        </li>

        <li>
          <Link to="/inventory">📦 Inventory</Link>
        </li>

        <li>
          <Link to="/reports">📊 Reports</Link>
        </li>

        <li>
          <Link to="/settings">⚙️ Settings</Link>
        </li>

      </ul>

    </div>
  );
}

export default Sidebar;