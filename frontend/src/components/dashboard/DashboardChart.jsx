function DashboardChart({ topSelling }) {

    // Maximum Sold Value
    const maxSold = Math.max(

        ...topSelling.map((item) => item.sold)

    );

    return (

        <div className="chart-box">

            <h2>📈 Top Selling Foods</h2>

            {

                topSelling.map((item) => (

                    <div

                        key={item.id}

                        className="chart-item"

                    >

                        <div className="chart-label">

                            <span>

                                🍽️ {item.name}

                            </span>

                            <strong>

                                {item.sold} Sold

                            </strong>

                        </div>

                        <div className="chart-bar">

                            <div

                                className="chart-fill"

                                style={{

                                    width: `${(item.sold / maxSold) * 100}%`

                                }}

                            ></div>

                        </div>

                    </div>

                ))

            }

        </div>

    );

}

export default DashboardChart;