import { useNavigate } from "react-router-dom";

function OrderSuccess() {

    const navigate = useNavigate();

    const tokenNumber = localStorage.getItem("tokenNumber");

    const qrCode = localStorage.getItem("qrCode");

    const orderAgain = () => {

    navigate("/customer-menu");

};

    return (

        <div
            style={{
                textAlign: "center",
                marginTop: "80px"
            }}
        >

            <h1>🎉 Order Placed Successfully</h1>

            <h2>Thank You For Ordering</h2>

            <h3>

                🪙 Token Number : {tokenNumber}

            </h3>

            <button
    onClick={() => navigate("/order-tracking")}
>

    📦 Track Order

</button>

<br /><br />

            <button
                onClick={orderAgain}
            >

                🍽 Order Again

            </button>

        </div>

    );

}

export default OrderSuccess;