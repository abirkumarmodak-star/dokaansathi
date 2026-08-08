import { useState } from "react";

function UpdateStockModal({

    item,

    onClose,

    onSave

}) {

   const [openingStock, setOpeningStock] = useState(
    item.prepared
);

    const saveStock = async () => {

        try {

            const response = await fetch(

                "https://dokaansathi.onrender.com/api/inventory/update-stock",

                {

                    method: "PUT",

                    headers: {

                        "Content-Type": "application/json"

                    },

                    body: JSON.stringify({

                        menu_id: item.menu_id,

                        opening_stock: openingStock

                    })

                }

            );

            const data = await response.json();

            alert(data.message);

            if (data.success) {

                onSave();

                onClose();

            }

        }

        catch (err) {

            console.log(err);

            alert("Server Error");

        }

    };

    return (

        <div className="modal-overlay">

            <div className="modal">

                <h2>📦 Update Stock</h2>

                <hr />

                <p><strong>Food :</strong> {item.name}</p>

                <p>
<strong>Current Stock :</strong>
{item.remaining}
</p>

               <p>
<strong>Online Sold :</strong>
{item.onlineSold}
</p>

                <p>
<strong>Offline Sold :</strong>
{item.offlineSold}
</p>

                <br />

                <label>

                    <strong>Today's Opening Stock</strong>

                </label>

                <input

                    type="number"

                    value={openingStock}

                    onChange={(e) =>

                        setOpeningStock(Number(e.target.value))

                    }

                />

                <br /><br />

                <button

                    onClick={onClose}

                >

                    Cancel

                </button>

                <button

                    onClick={saveStock}

                >

                    Save Stock

                </button>

            </div>

        </div>

    );

}

export default UpdateStockModal;

