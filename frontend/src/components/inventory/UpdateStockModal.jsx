import { useState } from "react";
import api from "../../Services/api";

const FETCH_JSON_CONFIG = {
    validateStatus: () => true,
    transformResponse: [(data) => data],
};

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

            const response = await api.put(
                "/inventory/update-stock",
                JSON.stringify({

                        menu_id: item.menu_id,

                        opening_stock: openingStock

                    }),
                {
                    ...FETCH_JSON_CONFIG,
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "*/*"
                    },
                }
            );

            const data = JSON.parse(response.data);

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

