import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
function QRManagement() {

    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {

        fetch("https://dokaansathi.onrender.com/api/tables")

            .then((res) => res.json())

            .then((data) => {

                console.log("API RESPONSE :", data);

                setTables(data.tables);

                setLoading(false);

            })

            .catch((err) => {

                console.log(err);

                setError("Failed To Load Tables");

                setLoading(false);

            });

    }, []);

    if (loading) {

        return <h2>Loading...</h2>;

    }

    if (error) {

        return <h2>{error}</h2>;

    }

    return (

        <div
            style={{
                padding: "30px"
            }}
        >

            <h1>QR Management</h1>

            <h3>Total Tables : {tables.length}</h3>

            <hr />

            {

                tables.map((table) => (

                    <div

                        key={table.id}

                        style={{

                            border: "1px solid #ccc",

                            padding: "15px",

                            marginBottom: "15px",

                            borderRadius: "10px"

                        }}

                    >

                        <h2>

                            Table {table.table_number}

                        </h2>

                        <p>

                            Capacity :
                            {table.capacity}

                        </p>

                        <p>

                            Status :
                            {table.status}

                        </p>
<div
    style={{
        width: 180,
        height: 180,
        background: "red",
        marginBottom: "10px"
    }}
>
    TEST BOX
</div>
                        <p>

                            QR Code :
                            {table.qr_code}

                        </p>
<div
    style={{
        background: "#fff",
        padding: "10px",
        display: "inline-block"
    }}
>
    <QRCode
        value={`http://localhost:5175/order/${table.qr_code}`}
        size={180}
    />
</div>
                    </div>

                ))

            }

        </div>

    );

}

export default QRManagement;
