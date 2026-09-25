import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "../pages/Login/Login";
import Dashboard from "../pages/Dashboard/Dashboard";
import Orders from "../pages/Orders/Orders";
import Menu from "../pages/Menu/Menu";
import QRMenu from "../pages/Customer/QRMenu";
function AppRoutes() {
    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/"
                    element={<Login />}
                />

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
    path="/order/:qrCode"
    element={<QRMenu />}
/>
            </Routes>
        </BrowserRouter>
    );
}

export default AppRoutes;