function BillDetailsModal({ bill, onClose }) {

    if (!bill) return null;

    return (

        <div className="modal-overlay">

            <div className="bill-modal">

                <h2>🧾 Bill Details</h2>

                <hr />

                <p><strong>Bill No :</strong> {bill.billNo}</p>

                <p><strong>Token :</strong> {bill.token}</p>

                <p><strong>Customer :</strong> {bill.customer}</p>

                <p><strong>Items :</strong> {bill.items}</p>

                <p><strong>Total :</strong> ₹{bill.total}</p>

                <p><strong>Payment :</strong> {bill.payment}</p>

                <p><strong>Status :</strong> {bill.status}</p>

                <p><strong>Time :</strong> {bill.time}</p>

                <hr />

                <button

                    className="print-btn"

                    onClick={() => window.print()}

                >

                    🖨 Print Bill

                </button>

                <button

                    className="close-btn"

                    onClick={onClose}

                >

                    Close

                </button>

            </div>

        </div>

    );

}

export default BillDetailsModal;