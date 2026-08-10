import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./OrderTracking.css";


function OrderTracking() {


    const navigate = useNavigate();


    const [token, setToken] = useState("");

    const [order, setOrder] = useState(null);

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");




    const statusSteps = [

        {
            name: "Pending",
            label: "✅ Order Placed"
        },

        {
            name: "Accepted",
            label: "👨‍🍳 Accepted"
        },

        {
            name: "Preparing",
            label: "🍳 Preparing"
        },

        {
            name: "Ready",
            label: "🔔 Ready"
        },

        {
            name: "Completed",
            label: "🎉 Completed"
        }

    ];





    // ===============================
    // GET ORDER BY TOKEN
    // ===============================

    const trackOrder = async () => {


        if(!token){

            alert("Enter Token Number");

            return;

        }



        try{


            setLoading(true);

            setError("");



            const response = await fetch(

                `https://dokaansathi.onrender.com/api/orders/token/${token}`

            );



            const data = await response.json();




            if(!response.ok){


                throw new Error(
                    data.message
                );


            }



            setOrder(data.order);



        }


        catch(err){


            console.log(err);


            setOrder(null);


            setError(
                err.message
            );


        }


        finally{


            setLoading(false);


        }


    };







    // ===============================
    // ADD MORE ITEMS
    // ===============================
const addMoreItems = () => {

    console.log("ADD MORE ITEMS CLICKED");

    localStorage.setItem(
        "existingOrderId",
        order.id
    );

    localStorage.setItem(
        "existingToken",
        order.token_number
    );

    const qrCode = localStorage.getItem("qrCode");

    if (!qrCode) {

        alert("QR Code Not Found");

        return;

    }

    navigate(`/menu/${qrCode}`);

};

      

 







    // ===============================
    // CANCEL ORDER
    // ===============================

    const cancelOrder = async()=>{


        try{


            const response = await fetch(

                "https://dokaansathi.onrender.com/api/orders/cancel",

                {

                    method:"PUT",

                    headers:{

                        "Content-Type":
                        "application/json"

                    },


                    body:JSON.stringify({

                        order_id:order.id

                    })

                }

            );



            const data =
            await response.json();




            alert(data.message);




            if(response.ok){


                trackOrder();


            }



        }


        catch(err){


            console.log(err);


            alert(
                "Cancel Failed"
            );


        }



    };






    return (


        <div className="order-tracking">


            <h1>
                📦 Order Tracking
            </h1>





            <div>


                <input

                    type="text"

                    placeholder="Enter Token Number"

                    value={token}

                    onChange={
                        e=>setToken(e.target.value)
                    }

                />



                <button

                    onClick={trackOrder}

                >

                    Track Order

                </button>



            </div>





            {
                loading &&

                <h3>
                    Loading...
                </h3>

            }





            {
                error &&

                <h3>

                    {error}

                </h3>

            }







            {

            order &&

            <div className="order-card">



                <h2>

                    🎫 Token:

                    {" "}

                    {order.token_number}

                </h2>





                <p>

                    Customer:

                    {" "}

                    {order.customer_name}

                </p>





                <p>

                    Amount:

                    ₹{order.total_amount}

                </p>





                <p>

                    Payment:

                    {order.payment_status}

                </p>






                <h2>
                    Current Status:
                </h2>






                <div className="timeline">


                {

                statusSteps.map((step,index)=>{



                    const currentIndex =

                    statusSteps.findIndex(

                        item =>

                        item.name ===
                        order.order_status

                    );




                    return (

                        <div key={step.name}>


                        {

                        index <= currentIndex

                        ?

                        <h3>
                            {step.label}
                        </h3>


                        :

                        <h3>
                            ⬜ {step.name}
                        </h3>

                        }


                        </div>

                    );


                })


                }


                </div>







                {

                order.order_status === "Pending"

                &&

                <div>


                    <button

                        onClick={addMoreItems}

                    >

                        ➕ Add More Items

                    </button>





                    <button

                        onClick={cancelOrder}

                    >

                        ❌ Cancel Order

                    </button>



                </div>

                }




            </div>


            }


        </div>


    );



}


export default OrderTracking;
