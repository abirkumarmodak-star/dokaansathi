import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";

import Login from "./pages/Login/Login";
import QRMenu from "./pages/customer/QRMenu";
import Dashboard from "./pages/Dashboard/Dashboard";
import Customers from "./pages/Customers/Customers";
import Menu from "./pages/Menu/Menu";
import Orders from "./pages/Orders/Orders";
import Billing from "./pages/Billing/Billing";
import Inventory from "./pages/Inventory/Inventory";
import Payment from "./pages/payment/Payment";
import Settings from "./pages/Settings/Settings";
import Staff from "./pages/Staff/Staff";
import StaffLogin from "./pages/StaffLogin/StaffLogin";
import StaffDashboard from "./pages/StaffDashboard/StaffDashboard";
import OwnerDashboard from "./pages/owner/OwnerDashboard";
import QRManagement from "./pages/owner/QRManagement";
// Customer
import LanguageSelection from "./pages/Customer/LanguageSelection";
import CustomerHome from "./pages/Customer/CustomerHome";
import HealthCheck from "./pages/Customer/HealthCheck";
import CustomerMenu from "./pages/Customer/CustomerMenu";
import Cart from "./pages/Customer/Cart";
import Checkout from "./pages/Customer/Checkout";
import OrderSuccess from "./pages/Customer/OrderSuccess";
import OwnerOrders from "./pages/owner/OwnerOrders";
import OrderTracking from "./pages/customer/OrderTracking";
import CustomerOrderEntry from "./pages/Customer/CustomerOrderEntry";


function App() {

    return (

        <BrowserRouter>

            <Routes>

                {/* Login */}

                <Route
                    path="/"
                    element={<Login />}
                />

                {/* Owner Layout */}

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

                <Route
                    path="/settings"
                    element={<Settings />}
                />

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

                {/* Customer */}

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
<Route
path="/menu/:qrCode"
element={<CustomerMenu />}
/>

<Route
    path="/checkout"
    element={<Checkout />}
/>
<Route

    path="/order-tracking"

    element={<OrderTracking />}

/>
<Route
    path="/order-success"
    element={<OrderSuccess />}
/>



<Route
    path="/owner/orders"
    element={<OwnerOrders />}
/>

<Route
    path="/order/:qrCode"
    element={<CustomerOrderEntry />}
/>
<Route
    path="/owner/dashboard"
    element={<OwnerDashboard />}
/>

<Route
    path="/owner/qr"
    element={<QRManagement />}
 />
 <Route
    path="/customer/cart/:qrCode"
    element={<Cart />}
/>
            </Routes>

        </BrowserRouter>

    );

}

export default App;
