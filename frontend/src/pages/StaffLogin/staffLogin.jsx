import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../Services/api.js";
import "./staffLogin.css";

function StaffLogin() {

    const navigate = useNavigate();

    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");

    const login = async () => {

        // ======================================================
        // VALIDATION
        // ======================================================

        if (phone === "" || password === "") {

            alert("Please Enter Phone and Password");

            return;
        }

        try {

            // ==================================================
            // STAFF LOGIN API
            // ==================================================

            const response = await api.post(
                "/staff/login",
                {
                    phone,
                    password
                },
                {
                    headers: { Accept: "*/*" },
                    validateStatus: () => true,
                    transformResponse: [(data) => data]
                }
            );

            const result = JSON.parse(response.data);

            if (
                !result ||
                typeof result !== "object" ||
                Array.isArray(result)
            ) {
                alert("Unable to connect to server");
                return;
            }

            // ==================================================
            // DEBUG
            // ==================================================

            console.log("STAFF LOGIN STATUS =", response.status);

            // ==================================================
            // LOGIN FAILED
            // ==================================================

            if (!result.success) {

                alert(result.message || "Login Failed");

                return;
            }

            if (
                typeof result.token !== "string" ||
                !result.token ||
                !result.staff ||
                typeof result.staff !== "object" ||
                Array.isArray(result.staff)
            ) {
                alert("Unable to connect to server");
                return;
            }

            // ==================================================
            // SAVE STAFF JWT TOKEN
            // ==================================================

            localStorage.setItem(
                "staffToken",
                result.token
            );

            // ==================================================
            // SAVE STAFF INFORMATION
            // ==================================================

            localStorage.setItem(
                "staffUser",
                JSON.stringify(result.staff)
            );

            // ==================================================
            // OPTIONAL: KEEP OLD STAFF DATA
            // ==================================================

            localStorage.setItem(
                "staff",
                JSON.stringify(result.staff)
            );
            // ==================================================
            // DEBUG
            // ==================================================

            console.log(
                "✅ STAFF LOGIN SUCCESS"
            );

            // ==================================================
            // SUCCESS
            // ==================================================

            alert("Login Successful");

            navigate("/staff-dashboard");

        } catch (error) {

            console.error(
                "❌ STAFF LOGIN ERROR =",
                error.message
            );

            const serverMessage = error.response?.data?.message;

            if (typeof serverMessage === "string" && serverMessage.trim()) {
                alert(serverMessage);
            } else if (error.response) {
                alert("Login Failed");
            } else {
                alert("Unable to connect to server");
            }
        }
    };

    // ======================================================
    // UI
    // ======================================================

    return (

        <div className="staff-login">

            <div className="login-card">

                <h1>👨‍🍳 Staff Login</h1>

                <input
                    type="text"
                    placeholder="Phone Number"
                    value={phone}
                    onChange={(e) =>
                        setPhone(e.target.value)
                    }
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) =>
                        setPassword(e.target.value)
                    }
                />

                <button onClick={login}>
                    Login
                </button>

            </div>

        </div>
    );
}

export default StaffLogin;
