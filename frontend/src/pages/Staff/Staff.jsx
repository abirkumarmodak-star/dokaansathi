import { useEffect, useState } from "react";
import Sidebar from "../../components/layout/Sidebar";
import "./Staff.css";

function Staff() {

    const [staff, setStaff] = useState([]);

    const [form, setForm] = useState({

        name: "",

        phone: "",

        password: "",

        role: "Counter"

    });

    const loadStaff = () => {

        fetch("https://dokaansathi.onrender.com/api/staff")

            .then((res) => res.json())

            .then((data) => {

                setStaff(data.staff);

            })

            .catch((err) => {

                console.log(err);

            });

    };

    useEffect(() => {

        loadStaff();

    }, []);

    const handleChange = (e) => {

        setForm({

            ...form,

            [e.target.name]: e.target.value

        });

    };

    const addStaff = async () => {

        if (

            form.name === "" ||

            form.phone === "" ||

            form.password === ""

        ) {

            alert("Please Fill All Fields");

            return;

        }

        const response = await fetch(

            "https://dokaansathi.onrender.com/api/staff",

            {

                method: "POST",

                headers: {

                    "Content-Type": "application/json"

                },

                body: JSON.stringify(form)

            }

        );

        const result = await response.json();

        alert(result.message);

        setForm({

            name: "",

            phone: "",

            password: "",

            role: "Counter"

        });

        loadStaff();

    };

    return (

        <div className="staff-container">

            <Sidebar />

            <div className="staff-page">

                <h1>👨‍🍳 Staff Management</h1>

                <hr />

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

                        {

                            staff.map((item) => (

                                <tr key={item.id}>

                                    <td>{item.id}</td>

                                    <td>{item.name}</td>

                                    <td>{item.phone}</td>

                                    <td>{item.role}</td>

                                    <td>{item.status}</td>

                                </tr>

                            ))

                        }

                    </tbody>

                </table>

            </div>

        </div>

    );

}

export default Staff;
