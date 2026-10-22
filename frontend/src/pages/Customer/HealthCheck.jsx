import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../Services/api.js";
import "./HealthCheck.css";

function HealthCheck() {

    const navigate = useNavigate();

    useEffect(() => {

        const checkServer = async () => {

            try {

                await api.get('/health', {
                    headers: { "Content-Type": null },
                });

                navigate("/customer-home");

            }

            catch (error) {

                navigate("/emergency");

            }

        };

        checkServer();

    }, [navigate]);

    return (

        <div className="health-container">

            <div className="loader"></div>

            <h2>
                Checking Restaurant...
            </h2>

            <p>
                Please wait...
            </p>

        </div>

    );

}

export default HealthCheck;
