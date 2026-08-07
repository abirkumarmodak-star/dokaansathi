import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./StaffLogin.css";

function StaffLogin() {

    const navigate = useNavigate();

    const [phone, setPhone] = useState("");

    const [password, setPassword] = useState("");

    const login = async () => {

        if (phone === "" || password === "") {

            alert("Please Enter Phone and Password");

            return;

        }

        const response = await fetch(

            "http://localhost:5000/api/staff/login",

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

        if (!result.success) {

            alert(result.message);

            return;

        }

        localStorage.setItem(

            "staff",

            JSON.stringify(result.staff)

        );

        alert("Login Successful");

        navigate("/staff-dashboard");

    };

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