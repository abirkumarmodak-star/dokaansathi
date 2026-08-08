import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./HealthCheck.css";

function HealthCheck() {

    const navigate = useNavigate();

    useEffect(() => {

        const checkServer = async () => {

            try {

                await axios.get(
                    "https://dokaansathi.onrender.com/api/health"
                );

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
