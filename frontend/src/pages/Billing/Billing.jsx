import { useState } from "react";

import "./Billing.css";

import billingData from "../../data/billingData";

import BillingCard from "../../components/billing/BillingCard";
import BillingFilter from "../../components/billing/BillingFilter";
import BillingTable from "../../components/billing/BillingTable";
import BillDetailsModal from "../../components/billing/BillDetailsModal";

function Billing() {

    // Bills
    const [bills, setBills] = useState(billingData);

    // Search
    const [search, setSearch] = useState("");

    // Status Filter
    const [statusFilter, setStatusFilter] = useState("All");

    // Selected Bill
    const [selectedBill, setSelectedBill] = useState(null);

    // Confirm Payment
    const handleConfirmPayment = (id) => {

        const updatedBills = bills.map((bill) =>

            bill.id === id

                ? {

                    ...bill,

                    status: "Confirmed"

                }

                : bill

        );

        setBills(updatedBills);

    };

    // Search + Filter
    const filteredBills = bills.filter((bill) => {

        const matchSearch =

            bill.customer.toLowerCase().includes(search.toLowerCase()) ||

            bill.billNo.toLowerCase().includes(search.toLowerCase()) ||

            bill.token.toLowerCase().includes(search.toLowerCase());

        const matchStatus =

            statusFilter === "All"

                ? true

                : bill.status === statusFilter;

        return matchSearch && matchStatus;

    });

    return (

        <div className="billing-page">

            <h1>💵 Billing Management</h1>

            <BillingCard bills={bills} />

            <BillingFilter

                search={search}

                setSearch={setSearch}

                statusFilter={statusFilter}

                setStatusFilter={setStatusFilter}

            />

            <BillingTable

                bills={filteredBills}

                onView={setSelectedBill}

                onConfirmPayment={handleConfirmPayment}

            />

            {

                selectedBill && (

                    <BillDetailsModal

                        bill={selectedBill}

                        onClose={() =>

                            setSelectedBill(null)

                        }

                    />

                )

            }

        </div>

    );

}

export default Billing;