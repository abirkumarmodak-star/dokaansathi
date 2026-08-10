
import { useEffect, useState } from "react";
import Sidebar from "../../components/layout/Sidebar";
import "./staff.css";

function Staff() {

    const [staff, setStaff] = useState([]);

    const [form, setForm] = useState({
        name: "",
        phone: "",
        password: "",
        role: "Counter"
    });

    // ======================================================
    // GET OWNER TOKEN
    // ======================================================

    const getToken = () => {

        const token = localStorage.getItem("token");

        if (token) {
            return token;
        }

        return null;
    };


    // ======================================================
    // LOAD STAFF
    // ======================================================

    const loadStaff = async () => {

        try {

            const token = getToken();

            if (!token) {

                alert("Owner login required");

                return;
            }


            const response = await fetch("https://dokaansathi.onrender.com/api/staff", {
    headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`
    }
})
         


            const data = await response.json();


            console.log("STAFF API RESPONSE =", data);


            if (!response.ok) {

                console.log(
                    "Staff Load Error:",
                    data.message
                );

                setStaff([]);

                return;
            }


            setStaff(
                Array.isArray(data.staff)
                    ? data.staff
                    : []
            );

        }

        catch (err) {

            console.log("Staff Load Error:", err);

            setStaff([]);
        }
    };


    // ======================================================
    // LOAD STAFF WHEN PAGE OPENS
    // ======================================================

    useEffect(() => {

        loadStaff();

    }, []);


    // ======================================================
    // FORM CHANGE
    // ======================================================

    const handleChange = (e) => {

        setForm({
            ...form,
            [e.target.name]: e.target.value
        });

    };


    // ======================================================
    // ADD STAFF
    // ======================================================

    const addStaff = async () => {

        if (
            form.name === "" ||
            form.phone === "" ||
            form.password === ""
        ) {

            alert("Please Fill All Fields");

            return;
        }


        try {

            const token = getToken();

            if (!token) {

                alert("Owner login required");

                return;
            }


            const response = await fetch(

                "https://dokaansathi.onrender.com/api/staff",

                {
                    method: "POST",

                    headers: {

                        "Content-Type": "application/json",

                        "Authorization": `Bearer ${token}`
                    },

                    body: JSON.stringify(form)
                }
            );


            const result = await response.json();


            console.log(
                "CREATE STAFF RESPONSE =",
                result
            );


            alert(
                result.message ||
                "Staff operation completed"
            );


            if (!response.ok) {

                return;
            }


            // Clear form only after successful creation

            setForm({

                name: "",
                phone: "",
                password: "",
                role: "Counter"

            });


            // Reload staff list

            loadStaff();

        }

        catch (error) {

            console.log(
                "Create Staff Error:",
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

        <div className="staff-container">

            <Sidebar />

            <div className="staff-page">

                <h1>👨‍🍳 Staff Management</h1>

                <hr />


                {/* STAFF FORM */}

                <div className="staff-form">

                    <input
                        type="text"
                        name="name"
                        placeholder="Staff Name"
                        value={form.name}
                        onChange={handleChange}
                    />


                    <input
                        type="text"
                        name="phone"
                        placeholder="Phone Number"
                        value={form.phone}
                        onChange={handleChange}
                    />


                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={form.password}
                        onChange={handleChange}
                    />


                    <select
                        name="role"
                        value={form.role}
                        onChange={handleChange}
                    >

                        <option value="Manager">
                            Manager
                        </option>

                        <option value="Counter">
                            Counter
                        </option>

                        <option value="Kitchen">
                            Kitchen
                        </option>

                        <option value="Waiter">
                            Waiter
                        </option>

                    </select>


                    <button onClick={addStaff}>
                        ➕ Add Staff
                    </button>

                </div>


                <hr />


                {/* STAFF TABLE */}

                <table>

                    <thead>

                        <tr>

                            <th>ID</th>

                            <th>Name</th>

                            <th>Phone</th>

                            <th>Role</th>

                            <th>Status</th>

                        </tr>

                    </thead>


                    <tbody>

                        {staff.length > 0 ? (

                            staff.map((item) => (

                                <tr key={item.id}>

                                    <td>{item.id}</td>

                                    <td>{item.name}</td>

                                    <td>{item.phone}</td>

                                    <td>{item.role}</td>

                                    <td>{item.status}</td>

                                </tr>

                            ))

                        ) : (

                            <tr>

                                <td colSpan="5">
                                    No Staff Found
                                </td>

                            </tr>

                        )}

                    </tbody>

                </table>

            </div>

        </div>
    );
}

export default Staff;

