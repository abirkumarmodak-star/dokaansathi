function BillingCard({ bills }) {

    const totalBills = bills.length;

    const totalRevenue = bills
        .filter((bill) => bill.status === "Paid")
        .reduce((sum, bill) => sum + bill.total, 0);

    const paidBills = bills.filter(
        (bill) => bill.status === "Paid"
    ).length;

    const pendingBills = bills.filter(
        (bill) => bill.status === "Pending"
    ).length;

    return (

        <div className="billing-cards">

            <div className="billing-card total">

                <h3>🧾 Total Bills</h3>

                <h2>{totalBills}</h2>

            </div>

            <div className="billing-card revenue">

                <h3>💰 Revenue</h3>

                <h2>₹{totalRevenue}</h2>

            </div>

            <div className="billing-card paid">

                <h3>✅ Paid</h3>

                <h2>{paidBills}</h2>

            </div>

            <div className="billing-card pending">

                <h3>⏳ Pending</h3>

                <h2>{pendingBills}</h2>

            </div>

        </div>

    );

}

export default BillingCard;