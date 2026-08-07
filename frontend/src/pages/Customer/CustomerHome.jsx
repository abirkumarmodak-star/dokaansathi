import { useNavigate } from "react-router-dom";

function CustomerHome() {

    const navigate = useNavigate();

    const startOrdering = () => {

        const qrCode = localStorage.getItem("qrCode");

        if (!qrCode) {

            alert("QR Code Not Found");

            return;

        }

        navigate(`/menu/${qrCode}`);
    };

    return (

        <div>

            <h1>Customer Home</h1>

            <button onClick={startOrdering}>

                🍽 Start Ordering

            </button>

        </div>

    );

}

export default CustomerHome;