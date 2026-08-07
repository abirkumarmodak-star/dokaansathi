function LowStockAlert({ items }) {

    return (

        <div className="dashboard-box">

            <h2>📦 Low Stock Alert</h2>

            {

                items.length === 0 ? (

                    <p>✅ No Low Stock Items</p>

                ) : (

                    items.map((item) => (

                        <div

                            key={item.id}

                            className="low-stock-item"

                        >

                            <span>

                                🍽️ {item.name}

                            </span>

                            <strong>

                                {item.remaining} Left

                            </strong>

                        </div>

                    ))

                )

            }

        </div>

    );

}

export default LowStockAlert;