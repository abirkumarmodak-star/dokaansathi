import { useEffect, useState } from "react";

import SearchBar from "../../components/menu/SearchBar";
import MenuTable from "../../components/menu/MenuTable";
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
        // ==========================
    // LOAD MENU ON PAGE LOAD
    // ==========================

    useEffect(() => {

        fetchMenu();

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

                <button

                    className="add-food-btn"

                    onClick={handleAddFood}

                >

                    + Add Food

                </button>

            </div>

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

        </div>

    );

}

export default Menu;
