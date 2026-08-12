import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";

// Owner / Admin
import Login from "./pages/Login/Login";
import Dashboard from "./pages/Dashboard/Dashboard";
import Customers from "./pages/Customers/Customers";
import Menu from "./pages/Menu/Menu";
import Orders from "./pages/Orders/Orders";
import Billing from "./pages/Billing/Billing";
import Inventory from "./pages/Inventory/Inventory";
import Payment from "./pages/payment/payment";
import Settings from "./pages/Settings/settings";
import Staff from "./pages/Staff/Staff";
import StaffLogin from "./pages/StaffLogin/staffLogin";
import StaffDashboard from "./pages/StaffDashboard/StaffDashboard";
import WalkInOrder from "./pages/Staff/WalkInOrder";
// Owner
import OwnerDashboard from "./pages/Owner/OwnerDashboard";
import OwnerOrders from "./pages/Owner/OwnerOrders";
import QRManagement from "./pages/Owner/QRManagement";
import OwnerRegister from "./pages/OwnerRegister/OwnerRegister";
// Customer
import LanguageSelection from "./pages/Customer/LanguageSelection";
import CustomerHome from "./pages/Customer/CustomerHome";
import HealthCheck from "./pages/Customer/HealthCheck";
import CustomerMenu from "./pages/Customer/CustomerMenu";
import QRMenu from "./pages/Customer/QRMenu";
import Cart from "./pages/Customer/Cart";
import Checkout from "./pages/Customer/Checkout";
import OrderSuccess from "./pages/Customer/OrderSuccess";
import OrderTracking from "./pages/Customer/OrderTracking";
import CustomerOrderEntry from "./pages/Customer/CustomerOrderEntry";

function App() {
    return (
        <BrowserRouter>
            <Routes>

                {/* =========================
                    LOGIN
                ========================= */}
                <Route
                    path="/"
                    element={<Login />}
                />

                {/* =========================
                    OWNER / ADMIN LAYOUT
                ========================= */}
                <Route element={<MainLayout />}>

                    <Route
                        path="/dashboard"
                        element={<Dashboard />}
                    />

                    <Route
                        path="/orders"
                        element={<Orders />}
                    />

                    <Route
                        path="/menu"
                        element={<Menu />}
                    />

                    <Route
                        path="/inventory"
                        element={<Inventory />}
                    />

                    <Route
                        path="/billing"
                        element={<Billing />}
                    />

                    <Route
                        path="/payment"
                        element={<Payment />}
                    />

                    <Route
                        path="/customers"
                        element={<Customers />}
                    />

                </Route>

                {/* =========================
                    SETTINGS
                ========================= */}
                <Route
                    path="/settings"
                    element={<Settings />}
                />

                {/* =========================
                    STAFF
                ========================= */}
                <Route
                    path="/staff"
                    element={<Staff />}
                />

                <Route
                    path="/staff-login"
                    element={<StaffLogin />}
                />

                <Route
                    path="/staff-dashboard"
                    element={<StaffDashboard />}
                />

                {/* =========================
                    CUSTOMER
                ========================= */}

                <Route
                    path="/customer"
                    element={<LanguageSelection />}
                />

                <Route
                    path="/customer-home"
                    element={<CustomerHome />}
                />

                <Route
                    path="/health"
                    element={<HealthCheck />}
                />

                {/* QR Menu */}
                <Route
                    path="/menu/:qrCode"
                    element={<QRMenu />}
                />

                {/* Customer Menu */}
                <Route
                    path="/customer-menu"
                    element={<CustomerMenu />}
                />
<Route
    path="/customer-menu/:qrCode"
    element={<CustomerMenu />}
/>
                {/* Cart */}
                <Route
                    path="/customer/cart/:qrCode"
                    element={<Cart />}
                />

                {/* Checkout */}
                <Route
                    path="/checkout"
                    element={<Checkout />}
                />

                {/* Order Success */}
                <Route
                    path="/order-success"
                    element={<OrderSuccess />}
                />

                {/* Order Tracking */}
                <Route
                    path="/order-tracking"
                    element={<OrderTracking />}
                />

                {/* QR Order Entry */}
                <Route
                    path="/order/:qrCode"
                    element={<CustomerOrderEntry />}
                />

                {/* =========================
                    OWNER DASHBOARD
                ========================= */}

                <Route
                    path="/owner/dashboard"
                    element={<OwnerDashboard />}
                />

                <Route
                    path="/owner/orders"
                    element={<OwnerOrders />}
                />

                <Route
                    path="/owner/qr"
                    element={<QRManagement />}
                />
<Route
    path="/owner-register"
    element={<OwnerRegister />}
/>
<Route
    path="/staff/walk-in"
    element={<WalkInOrder />}
/>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
