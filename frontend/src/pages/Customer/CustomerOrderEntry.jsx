import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";


const CustomerOrderEntry = () => {


    // QR CODE FROM URL
    const { qrCode } = useParams();


    // NAVIGATION
    const navigate = useNavigate();



    const [table, setTable] = useState(null);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");





    // ============================
    // LOAD TABLE INFORMATION
    // ============================

    useEffect(() => {


        const fetchTable = async () => {


            try {


                console.log(
                    "QR CODE:",
                    qrCode
                );



                const response = await fetch(
    `https://dokaansathi.onrender.com/api/tables/qr/${qrCode}`
);


                const data = await response.json();



                console.log(
                    "TABLE RESPONSE:",
                    data
                );




                if(data.success){


                    setTable(data.table);


                }
                else{


                    setError(
                        "Table not found"
                    );


                }



            }
            catch(error){


                console.log(
                    "API ERROR:",
                    error
                );


                setError(
                    "Server connection failed"
                );


            }
            finally{


                setLoading(false);


            }



        };



        fetchTable();



    },[qrCode]);








    // ============================
    // LOADING SCREEN
    // ============================

    if(loading){


        return(

            <div>

                <h2>
                    Loading Table Information...
                </h2>

            </div>

        );


    }







    // ============================
    // ERROR SCREEN
    // ============================

    if(error){


        return(

            <div>

                <h2>
                    ❌ {error}
                </h2>


            </div>

        );


    }








    // ============================
    // MAIN PAGE
    // ============================

    return(


        <div

        style={{
            padding:"30px",
            textAlign:"center"
        }}

        >



            <h1>
                Welcome to DokaanSathi AI
            </h1>





            <h2>
                Table Information
            </h2>





            <div

            style={{
                border:"1px solid #ddd",
                padding:"20px",
                borderRadius:"10px",
                maxWidth:"400px",
                margin:"auto"
            }}

            >



                <h3>

                    Table Number:
                    {" "}
                    {table.table_number}

                </h3>





                <p>

                    Capacity:
                    {" "}
                    {table.capacity}
                    {" "}
                    People

                </p>





                <p>

                    Status:
                    {" "}
                    {table.status}

                </p>





                <p>

                    QR Code:
                    {" "}
                    {table.qr_code}

                </p>






                <button


                onClick={()=>{


                    navigate(
                        `/menu/${qrCode}`
                    );


                }}



                style={{

                    padding:"12px 25px",

                    fontSize:"18px",

                    cursor:"pointer"

                }}



                >

                    Start Ordering

                </button>





            </div>





        </div>


    );


};




export default CustomerOrderEntry;
