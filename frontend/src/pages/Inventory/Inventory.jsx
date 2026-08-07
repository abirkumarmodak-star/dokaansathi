import { useState, useEffect } from "react";
import "./Inventory.css";

import InventoryCard from "../../components/inventory/InventoryCard";
import InventoryFilter from "../../components/inventory/InventoryFilter";
import InventoryTable from "../../components/inventory/InventoryTable";
import UpdateStockModal from "../../components/inventory/UpdateStockModal";

function Inventory() {

    // ==========================
    // STATES
    // ==========================

    const [inventory, setInventory] = useState([]);

    const [search, setSearch] = useState("");

    const [categoryFilter, setCategoryFilter] = useState("All");

    const [selectedItem, setSelectedItem] = useState(null);

    // ==========================
    // LOAD INVENTORY
    // ==========================
const loadInventory = async () => {

    try {

        const response = await fetch(
            "http://localhost:5000/api/inventory"
        );

        const data = await response.json();

        console.log("Inventory Data:", data);

        setInventory(data);

    }

    catch (err) {

        console.log(err);

    }

};
    
            

    // ==========================
    // LOAD WHEN PAGE OPENS
    // ==========================

    useEffect(() => {

        loadInventory();

    }, []);

    // ==========================
    // SEARCH + FILTER
    // ==========================

    const filteredInventory = inventory.filter((item) => {

        const matchSearch = item.name
            .toLowerCase()
            .includes(search.toLowerCase());

        const matchCategory =
            categoryFilter === "All"
                ? true
                : item.category === categoryFilter;

        return matchSearch && matchCategory;

    });

    // ==========================
    // UI
    // ==========================

    return (

        <div className="inventory-page">

            <h1>📦 Inventory Management</h1>

            <InventoryCard
                inventory={inventory}
            />

            <InventoryFilter
                search={search}
                setSearch={setSearch}
                categoryFilter={categoryFilter}
                setCategoryFilter={setCategoryFilter}
            />

            <InventoryTable
                inventory={filteredInventory}
                onUpdate={setSelectedItem}
            />

            {

                selectedItem && (

                    <UpdateStockModal

                        item={selectedItem}

                        onClose={() => setSelectedItem(null)}

                        onSave={loadInventory}

                    />

                )

            }

        </div>

    );

}

export default Inventory;