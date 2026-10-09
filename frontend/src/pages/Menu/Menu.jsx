import { useEffect, useState } from "react";

import SearchBar from "../../components/menu/Searchbar";
import MenuTable from "../../components/menu/Menutable";
import AddFoodModal from "../../components/menu/AddFoodModal";

import "./Menu.css";

function Menu() {

    console.log("✅ OWNER MENU LOADED");
        // ==========================
    // STATES
    // ==========================

    const [menuItems, setMenuItems] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [search, setSearch] = useState("");

    const [showModal, setShowModal] = useState(false);

    const [selectedFood, setSelectedFood] = useState(null);
    const [showComboModal, setShowComboModal] = useState(false);
    const [comboItem1, setComboItem1] = useState("");
const [comboItem2, setComboItem2] = useState("");
const [comboPrice, setComboPrice] = useState("");
const [comboPreferred, setComboPreferred] = useState(false);
const [editingCombo, setEditingCombo] = useState(null);
const [combos, setCombos] = useState([]);
        // ==========================
    // LOAD MENU
    // ==========================

    const fetchMenu = async () => {

        try {

            const response = await fetch(

                "https://dokaansathi.onrender.com/api/menu"

            );

            if (!response.ok) {

                throw new Error("Failed to fetch menu");

            }


    
            const data = await response.json();
const formattedMenu = data.map((item) => ({

    id: item.id,

    name: item.name,

    category: item.category,

    halfPrice: item.half_price
        ? Number(item.half_price)
        : null,

    fullPrice: Number(item.full_price),

    serving_type: item.serving_type,

    serving_size: item.serving_size,

    status:
        item.available
            ? "Available"
            : "Unavailable"

}));

              

       

            setMenuItems(formattedMenu);

            setLoading(false);

        }

        catch (err) {

            console.log(err);

            setError("Cannot connect to backend");

            setLoading(false);

        }

    };
    const fetchCombos = async () => {

    try {

        const response = await fetch(
            "https://dokaansathi.onrender.com/api/menu/combos"
        );

        if (!response.ok) {
            throw new Error("Failed to fetch combos");
        }

        const data = await response.json();

        setCombos(data.combos || []);

    }

    catch (err) {

        console.log("COMBO FETCH ERROR:", err);

    }

};
        // ==========================
    // LOAD MENU ON PAGE LOAD
    // ==========================

    useEffect(() => {

        fetchMenu();
 fetchCombos();
    }, []);

    // ==========================
    // SEARCH
    // ==========================

    const filteredMenu = menuItems.filter((item) =>

        item.name

            .toLowerCase()

            .includes(search.toLowerCase())

    );

    // ==========================
    // ADD FOOD
    // ==========================

    const handleAddFood = () => {

        setSelectedFood(null);

        setShowModal(true);

    };

    // ==========================
    // EDIT FOOD
    // ==========================

  const handleEdit = (food) => {

    setSelectedFood({

        ...food,

        halfPrice: food.halfPrice,

        fullPrice: food.fullPrice,

        servingType: food.serving_type,

        servingSize: food.serving_size

    });

    setShowModal(true);

};
        // ==========================
    // SAVE FOOD
    // ==========================

    const handleSaveFood = async (foodData) => {
const token = localStorage.getItem("token");

alert(token);
        try {

            const token = localStorage.getItem("token");

            let url = "https://dokaansathi.onrender.com/api/menu";

            let method = "POST";

            if (selectedFood) {

                url = `https://dokaansathi.onrender.com/api/menu/${selectedFood.id}`;

                method = "PUT";

            }

            const response = await fetch(

                url,

                {

                    method,

                    headers: {

                        "Content-Type": "application/json",

                        Authorization: `Bearer ${token}`

                    },

                    body: JSON.stringify({

    name: foodData.name,

    category: foodData.category,

    half_price: foodData.halfPrice,

    full_price: foodData.fullPrice,

    available:

        foodData.status === "Available"

            ? 1

            : 0,

    serving_type: foodData.servingType,

    serving_size: foodData.servingSize

})
                }

            );

            const data = await response.json();

            if (!response.ok) {

                alert(data.message);

                return;

            }

            alert(data.message);

            setShowModal(false);

            setSelectedFood(null);

            fetchMenu();

        }

        catch (err) {

            console.log(err);

            alert("Server Error");

        }

    };
        // ==========================
    // DELETE FOOD
    // ==========================

    const handleDelete = async (id) => {

        const confirmDelete = window.confirm(

            "Are you sure you want to delete this food?"

        );

        if (!confirmDelete) return;

        try {

            const token = localStorage.getItem("token");

            const response = await fetch(

                `https://dokaansathi.onrender.com/api/menu/${id}`,

                {

                    method: "DELETE",

                    headers: {

                        Authorization: `Bearer ${token}`

                    }

                }

            );

            const data = await response.json();

            if (!response.ok) {

                alert(data.message);

                return;

            }

            alert(data.message);

            fetchMenu();

        }

        catch (err) {

            console.log(err);

            alert("Server Error");

        }

    };

    // ==========================
    // TOGGLE STATUS
    // ==========================
// ==========================
// CREATE COMBO
// ==========================

const handleCreateCombo = async () => {

    // Check Item 1
    if (!comboItem1) {

        alert("Please select Item 1");

        return;
    }

    // Check Item 2
    if (!comboItem2) {

        alert("Please select Item 2");

        return;
    }

    // Same item check
    if (Number(comboItem1) === Number(comboItem2)) {

        alert("Item 1 and Item 2 cannot be the same");

        return;
    }

    // Check price
    if (!comboPrice || Number(comboPrice) <= 0) {

        alert("Please enter a valid combo price");

        return;
    }

    try {

        const token = localStorage.getItem("token");

      const response = await fetch(
    editingCombo
        ? `https://dokaansathi.onrender.com/api/menu/combos/${editingCombo.id}`
        : "https://dokaansathi.onrender.com/api/menu/combos",
    {
        method: editingCombo ? "PUT" : "POST",

                headers: {

                    "Content-Type": "application/json",

                    Authorization: `Bearer ${token}`

                },

                body: JSON.stringify({

                    item1_id: Number(comboItem1),

                    item2_id: Number(comboItem2),

                    combo_price: Number(comboPrice),

                    is_preferred: comboPreferred ? 1 : 0

                })

            }
        );

        const data = await response.json();

        if (!response.ok) {

            alert(data.message || "Failed to create combo");

            return;
        }

        alert(data.message || "Combo created successfully");
await fetchCombos();
        // Close modal
        setShowComboModal(false);

        // Clear form
        setComboItem1("");
        setComboItem2("");
        setComboPrice("");
        setComboPreferred(false);
setEditingCombo(null);
fetchCombos();
    }
    catch (err) {

        console.log(err);

        alert("Server Error");

    }

};
const handleEditCombo = (combo) => {
    setEditingCombo(combo);

    setComboItem1(String(combo.item1_id));
    setComboItem2(String(combo.item2_id));
    setComboPrice(String(combo.combo_price));
    setComboPreferred(Number(combo.is_preferred) === 1);

    setShowComboModal(true);
};
const handleDeleteCombo = async (comboId) => {
    const confirmed = window.confirm(
        "Are you sure you want to delete this combo?"
    );

    if (!confirmed) {
        return;
    }

    try {
        const token = localStorage.getItem("token");

        const response = await fetch(
            `https://dokaansathi.onrender.com/api/menu/combos/${comboId}`,
            {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Failed to delete combo");
            return;
        }

        alert(data.message || "Combo deleted successfully");

        fetchCombos();

    } catch (err) {
        console.log("DELETE COMBO ERROR:", err);
        alert("Server Error");
    }
};
    const handleToggleStatus = async (id) => {

        try {

            const token = localStorage.getItem("token");

            const response = await fetch(

                `https://dokaansathi.onrender.com/api/menu/toggle/${id}`,

                {

                    method: "PATCH",

                    headers: {

                        Authorization: `Bearer ${token}`

                    }

                }

            );

            const data = await response.json();

            if (!response.ok) {

                alert(data.message);

                return;

            }

            alert(data.message);

            fetchMenu();

        }

        catch (err) {

            console.log(err);

            alert("Server Error");

        }

    };
        // ==========================
    // LOADING
    // ==========================
// ==========================
// MAKE ALL MENU ITEMS UNAVAILABLE
// ==========================

const handleMakeAllUnavailable = async () => {

    const confirmAction = window.confirm(
        "Are you sure you want to make ALL menu items unavailable?"
    );

    if (!confirmAction) return;

    try {

        const token = localStorage.getItem("token");

        const response = await fetch(
            "https://dokaansathi.onrender.com/api/menu/make-all-unavailable",
            {
                method: "PATCH",

                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {

            alert(data.message || "Failed to update menu");

            return;
        }

        alert(data.message);

        fetchMenu();

    }
    catch (err) {

        console.log(err);

        alert("Server Error");

    }

};
    if (loading) {

        return <h2>Loading Menu...</h2>;

    }

    // ==========================
    // ERROR
    // ==========================

    if (error) {

        return <h2>{error}</h2>;

    }

    // ==========================
    // UI
    // ==========================

    return (

        <div className="menu-page">

            <div className="menu-header">

    <h1>🍽 Menu Management</h1>

    <div>

        <button
            className="add-food-btn"
            onClick={handleAddFood}
        >
            + Add Food
        </button>

        <button
            onClick={handleMakeAllUnavailable}
            style={{
                marginLeft: "10px",
                backgroundColor: "#dc2626",
                color: "white",
                border: "none",
                padding: "10px 15px",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600"
            }}
        >
            🔴 Make All Unavailable
        </button>

    </div>

</div>
<button

    onClick={() => setShowComboModal(true)}
    style={{
        marginLeft: "10px",
        backgroundColor: "#7c3aed",
        color: "white",
        border: "none",
        padding: "10px 15px",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: "600"
    }}
>
    🍱 Create Combo
</button>
            <SearchBar

                search={search}

                setSearch={setSearch}

            />

            <MenuTable

                menuItems={filteredMenu}

                onEdit={handleEdit}

                onDelete={handleDelete}

                onToggleStatus={handleToggleStatus}

            />
<div style={{ marginTop: "30px" }}>
    <h2>🍱 Combo Offers</h2>

    {combos.length === 0 ? (
        <p>No combos created yet.</p>
    ) : (
        combos.map((combo) => (
            <div
                key={combo.id}
                style={{
                    border: "1px solid #ddd",
                    borderRadius: "10px",
                    padding: "15px",
                    marginBottom: "12px"
                }}
            >
                <h3>
                    🍱 {combo.item1_name} + {combo.item2_name}
                </h3>

                <p>
                    Combo Price: ₹{combo.combo_price}
                </p>

                {Number(combo.is_preferred) === 1 && (
                    <p>⭐ Preferred</p>
                )}

                <p>
                    Status:{" "}
                    {Number(combo.available) === 1
                        ? "Available"
                        : "Unavailable"}
                </p>
                <button
    onClick={() => handleEditCombo(combo)}
    style={{
        marginTop: "10px",
        padding: "8px 15px",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer"
    }}
>
    ✏️ Edit Combo
</button>
<button
    onClick={() => handleDeleteCombo(combo.id)}
    style={{
        marginTop: "10px",
        marginLeft: "10px",
        padding: "8px 15px",
        border: "none",
        borderRadius: "6px",
        cursor: "pointer"
    }}
>
    🗑️ Delete Combo
</button>
            </div>
        ))
    )}
</div>
            {

                showModal && (

                    <AddFoodModal

                        onClose={() => {

                            setShowModal(false);

                            setSelectedFood(null);

                        }}

                        selectedFood={selectedFood}

                        onSave={handleSaveFood}

                    />

                )

            }
{
    showComboModal && (

        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,0.5)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 1000
            }}
        >

            <div
                style={{
                    backgroundColor: "white",
                    padding: "25px",
                    borderRadius: "10px",
                    width: "400px",
                    maxWidth: "90%"
                }}
            >

                <h2>🍱 Create Combo</h2>

                {/* ITEM 1 */}

                <label>Item 1</label>

                <select
                    value={comboItem1}
                    onChange={(e) => setComboItem1(e.target.value)}
                    style={{
                        width: "100%",
                        padding: "10px",
                        marginTop: "5px",
                        marginBottom: "15px"
                    }}
                >

                    <option value="">
                        Select Food
                    </option>

                    {menuItems.map((item) => (

                        <option
                            key={item.id}
                            value={item.id}
                        >
                            {item.name} — ₹{item.fullPrice}
                        </option>

                    ))}

                </select>


                {/* ITEM 2 */}

                <label>Item 2</label>

                <select
                    value={comboItem2}
                    onChange={(e) => setComboItem2(e.target.value)}
                    style={{
                        width: "100%",
                        padding: "10px",
                        marginTop: "5px",
                        marginBottom: "15px"
                    }}
                >

                    <option value="">
                        Select Food
                    </option>

                    {menuItems.map((item) => (

                        <option
                            key={item.id}
                            value={item.id}
                        >
                            {item.name} — ₹{item.fullPrice}
                        </option>

                    ))}

                </select>


                {/* COMBO PRICE */}

                <label>Combo Price</label>

                <input
                    type="number"
                    value={comboPrice}
                    onChange={(e) => setComboPrice(e.target.value)}
                    placeholder="Enter combo price"
                    min="1"
                    style={{
                        width: "100%",
                        padding: "10px",
                        marginTop: "5px",
                        marginBottom: "15px",
                        boxSizing: "border-box"
                    }}
                />


                {/* PREFERRED */}

                <label
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "20px"
                    }}
                >

                    <input
                        type="checkbox"
                        checked={comboPreferred}
                        onChange={(e) =>
                            setComboPreferred(e.target.checked)
                        }
                    />

                    ⭐ Preferred Combo

                </label>


                {/* BUTTONS */}

                <div
                    style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: "10px"
                    }}
                >

                    <button
                        onClick={() => {
                            setShowComboModal(false);
                            setComboItem1("");
                            setComboItem2("");
                            setComboPrice("");
                            setComboPreferred(false);
                        }}
                    >
                        Cancel
                    </button>

                    <button
                    onClick={handleCreateCombo}
                        style={{
                            backgroundColor: "#7c3aed",
                            color: "white",
                            border: "none",
                            padding: "10px 15px",
                            borderRadius: "6px",
                            cursor: "pointer"
                        }}
                    >
                        {editingCombo ? "Update Combo" : "Create Combo"}
                    </button>

                </div>

            </div>

        </div>

    )
}
        </div>

    );

}
// ==========================
// MAKE ALL MENU ITEMS UNAVAILABLE
// ==========================


export default Menu;


