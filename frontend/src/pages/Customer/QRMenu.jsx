import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";

function QRMenu() {

    console.log("✅ QR MENU PAGE LOADED");

    const { qrCode } = useParams();

    const navigate = useNavigate();

    useEffect(() => {

        console.log("QR CODE :", qrCode);

        // JFH-T3 → 3
        const tableNumber = qrCode.replace("JFH-T", "");

        console.log("TABLE NUMBER :", tableNumber);

        // Save Table Number
        localStorage.setItem("tableNumber", tableNumber);

        // Save Full QR
        localStorage.setItem("qrCode", qrCode);

        // Redirect after 1 second
        setTimeout(() => {

            navigate("/customer");

        }, 1000);

    }, [qrCode, navigate]);

    return (

        <div>

            <h1>🍽 Jana Food Hub</h1>

            <h2>QR Code : {qrCode}</h2>

            <h3>
                Redirecting...
            </h3>

        </div>

    );

}

export default QRMenu;