function OrderFilter({

    search,
    setSearch,

    statusFilter,
    setStatusFilter

}) {

    return (

        <div className="order-filter">

            <input

                type="text"

                placeholder="🔍 Search Customer / Token"

                value={search}

                onChange={(e) =>

                    setSearch(e.target.value)

                }

            />

            <select

                value={statusFilter}

                onChange={(e) =>

                    setStatusFilter(e.target.value)

                }

            >

                <option value="All">

                    All Orders

                </option>

                <option value="New">

                    🆕 New

                </option>

                <option value="Preparing">

                    👨‍🍳 Preparing

                </option>

                <option value="Ready">

                    🍽 Ready

                </option>

                <option value="Completed">

                    ✅ Completed

                </option>

                <option value="Cancelled">

                    ❌ Cancelled

                </option>

            </select>

        </div>

    );

}

export default OrderFilter;