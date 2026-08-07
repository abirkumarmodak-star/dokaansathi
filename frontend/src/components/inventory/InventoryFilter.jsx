function InventoryFilter({

    search,
    setSearch,

    categoryFilter,
    setCategoryFilter

}) {

    return (

        <div className="inventory-filter">

            <input

                type="text"

                placeholder="🔍 Search Food..."

                value={search}

                onChange={(e) =>

                    setSearch(e.target.value)

                }

            />

            <select

                value={categoryFilter}

                onChange={(e) =>

                    setCategoryFilter(e.target.value)

                }

            >

                <option value="All">All Categories</option>

                <option value="Breakfast">Breakfast</option>

                <option value="Main Course">Main Course</option>

                <option value="Snacks">Snacks</option>

                <option value="Veg">Veg</option>

                <option value="Drinks">Drinks</option>

            </select>

        </div>

    );

}

export default InventoryFilter;