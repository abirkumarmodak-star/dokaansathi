function BillingTable({

    bills,
    onView,
    onConfirmPayment

}) {

    return (

        <div className="table-container">

            <table className="billing-table">

                <thead>

                    <tr>

                        <th>Bill No</th>
                        <th>Token</th>
                        <th>Customer</th>
                        <th>Total</th>
                        <th>Payment</th>
                        <th>Billing Status</th>
                        <th>Time</th>
                        <th>Action</th>

                    </tr>

                </thead>

                <tbody>

                    {

                        bills.map((bill) => (

                            <tr key={bill.id}>

                                <td>{bill.billNo}</td>

                                <td>{bill.token}</td>

                                <td>{bill.customer}</td>

                                <td>₹{bill.total}</td>

                                <td>{bill.payment}</td>

                                <td>

                                    {

                                        bill.status === "Confirmed"

                                            ?

                                            <span className="confirmed-status">

                                                🟢 Confirmed

                                            </span>

                                            :

                                            <span className="not-confirmed-status">

                                                🟡 Not Confirmed

                                            </span>

                                    }

                                </td>

                                <td>{bill.time}</td>

                                <td>

                                    <button

                                        className="view-btn"

                                        onClick={() => onView(bill)}

                                    >

                                        👁 View Bill

                                    </button>

                                    {

                                        bill.status !== "Confirmed" && (

                                            <button

                                                className="confirm-btn"

                                                onClick={() =>

                                                    onConfirmPayment(bill.id)

                                                }

                                            >

                                                ✅ Confirm Payment

                                            </button>

                                        )

                                    }

                                </td>

                            </tr>

                        ))

                    }

                </tbody>

            </table>

        </div>

    );

}

export default BillingTable;