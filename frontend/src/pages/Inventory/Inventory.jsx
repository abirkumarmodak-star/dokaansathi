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
      
   "https://dokaansathi.onrender.com/api/inventory"
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
// LOW STOCK COMBO ALERT
// ==========================

const lowStockItems = inventory.filter((item) => {

    const remaining = Number(item.remaining || 0);

    return remaining > 0 && remaining < 7;

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
{/* ==========================
    LOW STOCK COMBO ALERT
========================== */}

{lowStockItems.length > 0 && (

    <div
        style={{
            backgroundColor: "#fff3cd",
            border: "1px solid #f0c36d",
            color: "#856404",
            padding: "14px 18px",
            borderRadius: "8px",
            margin: "15px 0",
            fontWeight: "600"
        }}
    >

        🟡 এখন আপনি আপনার প্রয়োজনীয় item-এর actual price-এর
        combo offer চালু করতে পারেন, কারণ stock কমে আসছে।

        <div style={{ marginTop: "8px" }}>

            {lowStockItems.map((item) => (

                <div key={item.id}>

                    • {item.name} — Remaining: {item.remaining}

                </div>

            ))}

        </div>

    </div>

)}
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
