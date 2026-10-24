
import { useEffect, useState } from "react";
import api from "../../Services/api.js";
import Sidebar from "../../components/layout/Sidebar";
import "./staff.css";

function Staff() {

    const [staff, setStaff] = useState([]);
    const [editingPhoneId, setEditingPhoneId] = useState(null);
const [editingPhone, setEditingPhone] = useState("");

const [resetPasswordId, setResetPasswordId] = useState(null);
const [newStaffPassword, setNewStaffPassword] = useState("");
const [editingStaffId, setEditingStaffId] = useState(null);

const [editingHours, setEditingHours] = useState({
    work_start_time: "",
    work_end_time: ""
});
  const [form, setForm] = useState({
    name: "",
    phone: "",
    password: "",
    role: "Counter",
    work_start_time: "",
    work_end_time: ""
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
const response = await api.get(
                "/staff",
                {
                    headers: {
                        "Content-Type": null,
                        Accept: "*/*",
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    },
                    validateStatus: () => true,
                    transformResponse: [(data) => data]
                }
            );

            const data = JSON.parse(response.data);
            if (response.status < 200 || response.status >= 300) {

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
// ===============================
// START EDITING DELIVERY BOY HOURS
// ===============================

const startEditHours = (item) => {

    setEditingStaffId(item.id);

    setEditingHours({
        work_start_time: item.work_start_time
            ? String(item.work_start_time).slice(0, 5)
            : "",
        work_end_time: item.work_end_time
            ? String(item.work_end_time).slice(0, 5)
            : ""
    });
};


// ===============================
// SAVE DELIVERY BOY HOURS
// ===============================

const saveWorkingHours = async (staffId) => {

    if (
        !editingHours.work_start_time ||
        !editingHours.work_end_time
    ) {
        alert("Please select both working hours");
        return;
    }

    if (
        editingHours.work_start_time >=
        editingHours.work_end_time
    ) {
        alert("Work start time must be earlier than work end time");
        return;
    }

    try {

        const token = getToken();

        if (!token) {
            alert("Owner login required");
            return;
        }

        console.log("========== UPDATE WORKING HOURS ==========");
        console.log("STAFF ID =", staffId);
        console.log("START =", editingHours.work_start_time);
        console.log("END =", editingHours.work_end_time);

        const response = await api.patch(
            `/staff/${staffId}/work-hours`,
            {
                work_start_time: editingHours.work_start_time,
                work_end_time: editingHours.work_end_time
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "*/*",
                    "Authorization": `Bearer ${token}`
                },
                validateStatus: () => true,
                transformResponse: [(data) => data]
            }
        );

        const result = JSON.parse(response.data);

        console.log("UPDATE WORKING HOURS RESPONSE =", result);

        if (response.status < 200 || response.status >= 300) {
            alert(result.message || "Failed to update working hours");
            return;
        }

        alert("✅ Working hours updated successfully");

        setEditingStaffId(null);

        setEditingHours({
            work_start_time: "",
            work_end_time: ""
        });

        // Reload latest staff data
        loadStaff();

    } catch (error) {

        console.error(
            "Update Working Hours Error =",
            error
        );

        alert("Unable to connect to server");
    }
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


            const response = await api.post(
                "/staff",
                form,
                {
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "*/*",
                        "Authorization": `Bearer ${token}`
                    },
                    validateStatus: () => true,
                    transformResponse: [(data) => data]
                }
            );


            const result = JSON.parse(response.data);


            console.log(
                "CREATE STAFF RESPONSE =",
                result
            );


            alert(
                result.message ||
                "Staff operation completed"
            );


            if (response.status < 200 || response.status >= 300) {

                return;
            }


            // Clear form only after successful creation

       setForm({
    name: "",
    phone: "",
    password: "",
    role: "Counter",
    work_start_time: "",
    work_end_time: ""
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

const saveStaffPhone = async (staffId) => {
    const phone = editingPhone.trim();

    if (!/^[0-9]{10,15}$/.test(phone)) {
        alert("Enter a valid phone number (10–15 digits)");
        return;
    }

    try {
        const response = await api.patch(
            `/staff/${staffId}/phone`,
            { phone },
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getToken()}`
                },
                validateStatus: () => true,
                transformResponse: [(data) => data]
            }
        );

        const data = JSON.parse(response.data);

        if (response.status < 200 || response.status >= 300) {
            alert(data.message || "Phone update failed");
            return;
        }

        alert("Phone number updated successfully");
        setEditingPhoneId(null);
        setEditingPhone("");
        await loadStaff();
    } catch {

        alert("Could not update phone number");
    }
};

const resetStaffPassword = async (staffId) => {
    if (newStaffPassword.length < 6) {
        alert("Password must be at least 6 characters");
        return;
    }

    if (!window.confirm("Reset this staff member's password?")) {
        return;
    }

    try {
        const response = await api.post(
            "/staff/reset-password",
            {
                staffId,
                newPassword: newStaffPassword
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getToken()}`
                },
                validateStatus: () => true,
                transformResponse: [(data) => data]
            }
        );

        const data = JSON.parse(response.data);

        if (response.status < 200 || response.status >= 300) {
            alert(data.message || "Password reset failed");
            return;
        }

        alert("Password reset successfully");
        setResetPasswordId(null);
        setNewStaffPassword("");
    } catch {

        alert("Could not reset password");
    }
};

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
<option value="DeliveryBoy">
    Delivery Boy
</option>
                    </select>
{form.role === "DeliveryBoy" && (
    <div className="working-hours">
        <label>Working Hours</label>

        <div className="working-time-row">
            <div>
                <label>Work From</label>
                <input
                    type="time"
                    name="work_start_time"
                    value={form.work_start_time}
                    onChange={handleChange}
                />
            </div>

            <div>
                <label>Work Until</label>
                <input
                    type="time"
                    name="work_end_time"
                    value={form.work_end_time}
                    onChange={handleChange}
                />
            </div>
        </div>
    </div>
)}

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
<th>Working Hours</th>
                            <th>Status</th>
<th>Actions</th>
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
<td>
    {item.role === "DeliveryBoy" ? (

        editingStaffId === item.id ? (

            <div className="working-hours-edit">

                <input
                    type="time"
                    value={editingHours.work_start_time}
                    onChange={(e) =>
                        setEditingHours({
                            ...editingHours,
                            work_start_time: e.target.value
                        })
                    }
                />

                <span> - </span>

                <input
                    type="time"
                    value={editingHours.work_end_time}
                    onChange={(e) =>
                        setEditingHours({
                            ...editingHours,
                            work_end_time: e.target.value
                        })
                    }
                />

                <button
                    onClick={() =>
                        saveWorkingHours(item.id)
                    }
                >
                    💾 Save
                </button>

                <button
                    onClick={() => {
                        setEditingStaffId(null);
                        setEditingHours({
                            work_start_time: "",
                            work_end_time: ""
                        });
                    }}
                >
                    ❌ Cancel
                </button>

            </div>

        ) : (

            <div>

                <span>
                    {item.work_start_time
                        ? String(item.work_start_time).slice(0, 5)
                        : "--"}
                    {" - "}
                    {item.work_end_time
                        ? String(item.work_end_time).slice(0, 5)
                        : "--"}
                </span>

                <button
                    onClick={() => startEditHours(item)}
                >
                    ✏️ Edit
                </button>

            </div>

        )

    ) : (
        "--"
    )}
</td>
                                    <td>{item.status}</td>

<td>
    {editingPhoneId === item.id ? (
        <div>
            <input
                type="tel"
                value={editingPhone}
                onChange={(e) => setEditingPhone(e.target.value)}
                placeholder="New phone number"
            />

            <button onClick={() => saveStaffPhone(item.id)}>
                Save Phone
            </button>

            <button onClick={() => {
                setEditingPhoneId(null);
                setEditingPhone("");
            }}>
                Cancel
            </button>
        </div>
    ) : resetPasswordId === item.id ? (
        <div>
            <input
                type="password"
                value={newStaffPassword}
                onChange={(e) => setNewStaffPassword(e.target.value)}
                placeholder="New password"
                autoComplete="new-password"
            />

            <button onClick={() => resetStaffPassword(item.id)}>
                Save Password
            </button>

            <button onClick={() => {
                setResetPasswordId(null);
                setNewStaffPassword("");
            }}>
                Cancel
            </button>
        </div>
    ) : (
        <div>
            <button onClick={() => {
                setEditingPhoneId(item.id);
                setEditingPhone(String(item.phone || ""));
                setResetPasswordId(null);
                setNewStaffPassword("");
            }}>
                Edit Phone
            </button>

            <button onClick={() => {
                setResetPasswordId(item.id);
                setNewStaffPassword("");
                setEditingPhoneId(null);
                setEditingPhone("");
            }}>
                Reset Password
            </button>
        </div>
    )}
</td>

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

