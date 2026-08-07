function MenuTable({

    menuItems,

    onEdit,

    onDelete,

    onToggleStatus

}) {

    return (

        <div className="table-container">

            <div className="menu-stats">

                <div className="stat-card">

                    <h3>Total Foods</h3>

                    <p>{menuItems.length}</p>

                </div>

                <div className="stat-card">

                    <h3>Available</h3>

                    <p>

                        {

                            menuItems.filter(

                                (item) => item.status === "Available"

                            ).length

                        }

                    </p>

                </div>

                <div className="stat-card">

                    <h3>Unavailable</h3>

                    <p>

                        {

                            menuItems.filter(

                                (item) => item.status === "Unavailable"

                            ).length

                        }

                    </p>

                </div>

            </div>

            <table className="menu-table">

                <thead>

                    <tr>

                        <th>Image</th>

                        <th>Food Name</th>

                        <th>Category</th>

                        <th>Plate</th>

                        <th>Price</th>

                        <th>Status</th>

                        <th>Action</th>

                    </tr>

                </thead>

                <tbody>
        {

    menuItems.map((item) => (

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

                {

                    item.serving_size === "Half + Full"

                        ? "Half + Full"

                        : "Full Only"

                }

            </td>

        <td>

    {

        item.serving_size === "Half + Full"

            ?

            `₹${item.halfPrice} / ₹${item.fullPrice}`

            :

            `₹${item.fullPrice}`

    }

</td>

            <td>

                <button

                    className={

                        item.status === "Available"

                            ? "status-btn available"

                            : "status-btn unavailable"

                    }

                    onClick={() => onToggleStatus(item.id)}

                >

                    {item.status}

                </button>

            </td>

            <td>
                   <button

                    className="edit-btn"

                    onClick={() => onEdit(item)}

                >

                    ✏️ Edit

                </button>

                <button

                    className="delete-btn"

                    onClick={() => onDelete(item.id)}

                >

                    🗑 Delete

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

export default MenuTable;                        