import "./Navbar.css";

function Navbar() {
  return (
    <div className="navbar">

      <div className="navbar-left">
        <h2>JANA FOOD HUB</h2>
      </div>

      <div className="navbar-right">

        <button className="language-btn">
          🌐 বাংলা
        </button>

        <button className="notification-btn">
          🔔
        </button>

        <div className="profile">
          👤 Owner
        </div>

      </div>

    </div>
  );
}

export default Navbar;