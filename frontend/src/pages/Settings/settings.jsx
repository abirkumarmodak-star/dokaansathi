import { useEffect, useState } from "react";

import Sidebar from "../../components/layout/Sidebar";

import "./Settings.css";

function Settings() {

    const [settings, setSettings] = useState({

        shop_name: "",

        owner_name: "",

        phone: "",

        upi_id: "",

        language: "English"

    });

    useEffect(() => {

        fetch("https://dokaansathi.onrender.com/api/shop-settings")

            .then((res) => res.json())

            .then((data) => {

                setSettings(data.settings);

            })

            .catch((err) => {

                console.log(err);

            });

    }, []);

    const handleChange = (e) => {

        setSettings({

            ...settings,

            [e.target.name]: e.target.value

        });

    };

    const saveSettings = async () => {

        const response = await fetch(

            "https://dokaansathi.onrender.com/api/shop-settings",

            {

                method: "PUT",

                headers: {

                    "Content-Type": "application/json"

                },

                body: JSON.stringify(settings)

            }

        );

        const result = await response.json();

        alert(result.message);

    };

    return (

        <div style={{ display: "flex" }}>

            <Sidebar />

            <div className="settings-page">

                <h1>⚙ Shop Settings</h1>

                <hr />

                <label>Shop Name</label>

                <input

                    type="text"

                    name="shop_name"

                    value={settings.shop_name}

                    onChange={handleChange}

                />

                <label>Owner Name</label>

                <input

                    type="text"

                    name="owner_name"

                    value={settings.owner_name}

                    onChange={handleChange}

                />

                <label>Phone Number</label>

                <input

                    type="text"

                    name="phone"

                    value={settings.phone}

                    onChange={handleChange}

                />

                <label>UPI ID</label>

                <input

                    type="text"

                    name="upi_id"

                    value={settings.upi_id}

                    onChange={handleChange}

                />

                <label>Language</label>

                <select

                    name="language"

                    value={settings.language}

                    onChange={handleChange}

                >

                    <option>English</option>

                    <option>বাংলা</option>

                    <option>Hindi</option>

                </select>

                <br />
                <br />

                <button onClick={saveSettings}>

                    💾 Save Settings

                </button>

            </div>

        </div>

    );

}

export default Settings;
