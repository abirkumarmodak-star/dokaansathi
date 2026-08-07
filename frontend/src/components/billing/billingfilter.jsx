function BillingFilter({

    search,
    setSearch,

    statusFilter,
    setStatusFilter

}) {

    return (

        <div className="billing-filter">

            <input

                type="text"

                placeholder="🔍 Search Customer / Bill No / Token"

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

                    All Bills

                </option>

                <option value="Paid">

                    ✅ Paid

                </option>

                <option value="Pending">

                    ⏳ Pending

                </option>

            </select>

        </div>

    );

}

export default BillingFilter;