import { useState } from "react";
import { useNavigate } from "react-router-dom";
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

            const response = await fetch(
                "https://dokaansathi.onrender.com/api/staff/login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        phone,
                        password
                    })
                }
            );

            const result = await response.json();

            // ==================================================
            // DEBUG
            // ==================================================

            console.log("STAFF LOGIN STATUS =", response.status);
            console.log("STAFF LOGIN RESPONSE =", result);

            // ==================================================
            // LOGIN FAILED
            // ==================================================

            if (!result.success) {

                alert(result.message || "Login Failed");

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
console.log("TOKEN FROM SERVER =", result.token);


console.log(
    "AFTER SAVE TOKEN =",
    localStorage.getItem("staffToken")
);

console.log(
    "AFTER SAVE USER =",
    localStorage.getItem("staffUser")
);
            // ==================================================
            // DEBUG
            // ==================================================

            console.log(
                "✅ STAFF LOGIN SUCCESS"
            );

            console.log(
                "STAFF USER =",
                result.staff
            );

            console.log(
                "STAFF ROLE =",
                result.staff.role
            );

            console.log(
                "STAFF TOKEN SAVED =",
                !!localStorage.getItem("staffToken")
            );

            // ==================================================
            // SUCCESS
            // ==================================================

            alert("Login Successful");

            navigate("/staff-dashboard");

        } catch (error) {

            console.error(
                "❌ STAFF LOGIN ERROR =",
                error
            );

            alert(
                "Unable to connect to server"
            );
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