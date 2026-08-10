import { useState } from "react";
import { useNavigate } from "react-router-dom";

function OwnerRegister() {

    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [language, setLanguage] = useState("English");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleRegister = async () => {

        setError("");

        if (!name.trim() || !phone.trim() || !password.trim()) {

            setError("Name, Phone and Password are required");

            return;
        }

        if (password !== confirmPassword) {

            setError("Passwords do not match");

            return;
        }

        if (password.length < 6) {

            setError("Password must be at least 6 characters");

            return;
        }

        try {

            setLoading(true);

            const response = await fetch(
                "https://dokaansathi.onrender.com/api/users",
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        name,
                        phone,
                        password,
                        language
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {

                setError(
                    data.message ||
                    "Account creation failed"
                );

                return;
            }

            alert(
                "Owner Account Created Successfully"
            );

            navigate("/");

        }
        catch (error) {

            console.error(
                "REGISTER ERROR:",
                error
            );

            setError(
                "Unable to connect to server"
            );

        }
        finally {

            setLoading(false);

        }

    };

    return (

        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: "20px"
            }}
        >

            <div
                style={{
                    width: "100%",
                    maxWidth: "420px",
                    padding: "30px",
                    borderRadius: "15px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.15)"
                }}
            >

                <h1>
                    Create Owner Account
                </h1>

                <p>
                    Create your DokaanSathi owner account
                </p>

                <div>

                    <label>
                        Owner Name
                    </label>

                    <input
                        type="text"
                        placeholder="Enter your name"
                        value={name}
                        onChange={(e) =>
                            setName(e.target.value)
                        }
                    />

                </div>

                <br />

                <div>

                    <label>
                        Mobile Number
                    </label>

                    <input
                        type="tel"
                        placeholder="Enter mobile number"
                        value={phone}
                        onChange={(e) =>
                            setPhone(e.target.value)
                        }
                    />

                </div>

                <br />

                <div>

                    <label>
                        Password
                    </label>

                    <input
                        type="password"
                        placeholder="Create password"
                        value={password}
                        onChange={(e) =>
                            setPassword(e.target.value)
                        }
                    />

                </div>

                <br />

                <div>

                    <label>
                        Confirm Password
                    </label>

                    <input
                        type="password"
                        placeholder="Confirm password"
                        value={confirmPassword}
                        onChange={(e) =>
                            setConfirmPassword(e.target.value)
                        }
                    />

                </div>

                <br />

                <div>

                    <label>
                        Language
                    </label>

                    <select
                        value={language}
                        onChange={(e) =>
                            setLanguage(e.target.value)
                        }
                    >

                        <option value="English">
                            English
                        </option>

                        <option value="বাংলা">
                            বাংলা
                        </option>

                        <option value="Hindi">
                            Hindi
                        </option>

                    </select>

                </div>

                <br />

                {error && (

                    <p
                        style={{
                            color: "red"
                        }}
                    >
                        {error}
                    </p>

                )}

                <button
                    onClick={handleRegister}
                    disabled={loading}
                >

                    {loading
                        ? "Creating Account..."
                        : "Create Owner Account"}

                </button>

                <br />
                <br />

                <button
                    onClick={() => navigate("/")}
                >
                    Back to Login
                </button>

            </div>

        </div>

    );

}

export default OwnerRegister;