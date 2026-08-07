function InventoryCard({ inventory }) {

    // Total Items
    const totalItems = inventory.length;

    // Available
    const availableItems = inventory.filter(

        (item) => item.stock_quantity > item.reorder_level

    ).length;

    // Low Stock
    const lowStockItems = inventory.filter(

        (item) =>

            item.stock_quantity > 0 &&

            item.stock_quantity <= item.reorder_level

    ).length;

    // Out Of Stock
    const outOfStockItems = inventory.filter(

        (item) => item.stock_quantity === 0

    ).length;

    return (

        <div className="inventory-cards">

            <div className="inventory-card">

                <h3>📦 Total Items</h3>

                <h2>{totalItems}</h2>

            </div>

            <div className="inventory-card">

                <h3>🟢 Available</h3>

                <h2>{availableItems}</h2>

            </div>

            <div className="inventory-card">

                <h3>🟡 Low Stock</h3>

                <h2>{lowStockItems}</h2>

            </div>

            <div className="inventory-card">

                <h3>🔴 Out Of Stock</h3>

                <h2>{outOfStockItems}</h2>

            </div>

        </div>

    );

}

export default InventoryCard;
