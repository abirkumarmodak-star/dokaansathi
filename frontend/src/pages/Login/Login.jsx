import "./Login.css";

import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {

    const navigate = useNavigate();

    // ===========================
    // STATES
    // ===========================

    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");

    // ===========================
    // LOGIN
    // ===========================

    const handleLogin = async () => {

        if (phone.trim() === "" || password.trim() === "") {

            setError("Please enter phone and password");

            return;

        }

        try {

            setLoading(true);

            setError("");

            const response = await fetch(
                "https://dokaansathi.onrender.com/api/users/login",
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

            const data = await response.json();
console.log("LOGIN RESPONSE:", data);
console.log("TOKEN =", data.token);

alert(data.token);
            if (!response.ok) {

                setError(data.message);

                setLoading(false);

                return;

            }

            // Save JWT

            localStorage.setItem(

                "token",

                data.token

            );
alert(localStorage.getItem("token"));
            // Save User

            localStorage.setItem(

                "user",

                JSON.stringify(data.user)

            );

            alert("Login Successful");

            navigate("/dashboard");

        }
catch (err) {

    console.error("LOGIN ERROR :", err);

    setError(err.message);

}
        finally {

            setLoading(false);

        }

    };

    // ===========================
    // UI
    // ===========================

    return (

        <div className="login-container">

            <div className="login-card">

                <div className="logo-box">

                    🍽

                </div>

                <h1>JANA FOOD HUB</h1>

                <p className="address">

                    Manguria Ranchi Road, Purulia

                </p>

                <h2>DOKAAN SATHI</h2>

                <p className="welcome">

                    Welcome Back

                </p>

                <div className="input-group">

                    <label>

                        📱 Mobile Number

                    </label>

                    <input

                        type="text"

                        placeholder="Enter Mobile Number"

                        value={phone}

                        onChange={(e) =>

                            setPhone(e.target.value)

                        }

                    />

                </div>

                <div className="input-group">

                    <label>

                        🔒 Password

                    </label>

                    <div className="password-box">

                        <input

                            type={

                                showPassword

                                    ? "text"

                                    : "password"

                            }

                            placeholder="Enter Password"

                            value={password}

                            onChange={(e) =>

                                setPassword(e.target.value)

                            }

                        />

                        <button

                            type="button"

                            className="eye-btn"

                            onClick={() =>

                                setShowPassword(

                                    !showPassword

                                )

                            }

                        >

                            {

                                showPassword

                                    ? "🙈"

                                    : "👁"

                            }

                        </button>

                    </div>

                </div>

                {

                    error &&

                    <p

                        style={{

                            color: "red",

                            textAlign: "center",

                            marginBottom: "15px"

                        }}

                    >

                        {error}

                    </p>

                }

                <button

                    className="login-btn"

                    onClick={handleLogin}

                    disabled={loading}

                >

                    {

                        loading

                            ? "Logging..."

                            : "Login"

                    }

                </button>
<button
    type="button"
    onClick={() => navigate("/owner-register")}
>
    Create Owner Account
</button>
                <div className="language-box">

                    <button>

                        বাংলা

                    </button>

                    <button>

                        English

                    </button>

                    <button>

                        हिन्दी

                    </button>

                </div>

                <hr />

                <button

                    className="customer-btn"

                    onClick={() =>

                        alert(

                            "Customer QR Ordering Module will be added during Customer Phase."

                        )

                    }

                >

                    🍽 Customer Order

                </button>
<button
    className="register-btn"
    onClick={() => navigate("/owner-register")}
>
    Create Owner Account
</button>
            </div>

        </div>

    );

}

export default Login;
