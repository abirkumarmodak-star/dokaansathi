import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";

import { Outlet } from "react-router-dom";

function MainLayout() {

    return (

        <div
            style={{
                display: "flex",
                minHeight: "100vh"
            }}
        >

            <Sidebar />

            <div
                style={{
                    flex: 1
                }}
            >

                <Navbar />

                <div
                    style={{
                        padding: "20px"
                    }}
                >

                    <Outlet />

                </div>

            </div>

        </div>

    );

}

export default MainLayout;