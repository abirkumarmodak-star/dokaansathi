function InventoryTable({

    inventory,

    onUpdate

}) {

    return (

        <div className="table-container">

            <table className="inventory-table">

                <thead>

                    <tr>

                        <th>Image</th>

                        <th>Food Name</th>

                        <th>Category</th>

                        <th>Prepared</th>

                        <th>Online Sold</th>

                        <th>Offline Sold</th>

                        <th>Remaining</th>

                        <th>Status</th>

                        <th>Action</th>

                    </tr>

                </thead>

                <tbody>

                    {

                        inventory.map((item) => (

                            <tr key={item.id}>

                                <td>

                                    <img

                                        src={item.image || "/images/food.jpg"}

                                        alt={item.name}

                                        className="food-image"

                                    />

                                </td>

                                <td>

                                    <strong>{item.name}</strong>

                                </td>

                                <td>{item.category}</td>

                                <td>

                                    {item.prepared} {item.unit}

                                </td>

                                <td>{item.onlineSold}</td>

                                <td>{item.offlineSold}</td>

                                <td>

                                    <strong>

                                        {item.remaining}

                                    </strong>

                                </td>

                                <td>

                                    {

                                        item.status === "Available"

                                            ?

                                            <span className="status available">

                                                🟢 Available

                                            </span>

                                            :

                                            item.status === "Low Stock"

                                                ?

                                                <span className="status low">

                                                    🟡 Low Stock

                                                </span>

                                                :

                                                <span className="status out">

                                                    🔴 Out Of Stock

                                                </span>

                                    }

                                </td>

                                <td>

                                    <button

                                        className="update-btn"

                                        onClick={() => onUpdate(item)}

                                    >

                                        ✏️ Update

                                    </button>

                                </td>

                            </tr>

                        ))

                    }

                </tbody>

            </table>

        </div>

    );

}

export default InventoryTable;