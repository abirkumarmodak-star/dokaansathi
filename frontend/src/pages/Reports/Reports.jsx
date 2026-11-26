import { useCallback, useEffect, useState } from "react";
import api from "../../Services/api";
import "./Reports.css";

const reportEndpoints = {
    daily: "/reports/daily",
    monthly: "/reports/monthly",
    best: "/reports/best-product",
    least: "/reports/least-product",
};

const getMetric = (report, keys) => {
    if (!report) return "—";

    for (const key of keys) {
        if (report[key] !== undefined && report[key] !== null) {
            return report[key];
        }
    }

    return "—";
};

const currencyValue = (value) => {
    if (value === "—") return value;

    const text = String(value);
    return text.includes("₹") ? text : `₹${text}`;
};

function ReportCard({ title, report, error, loading, metrics }) {
    return (
        <div className="report-card">
            <h3>{title}</h3>

            {loading ? (
                <p className="report-message">Loading report...</p>
            ) : error ? (
                <p className="report-error">{error}</p>
            ) : !report ? (
                <p className="report-message">No report data available.</p>
            ) : (
                <div className="report-metrics">
                    {metrics.map((metric) => (
                        <div className="report-metric" key={metric.label}>
                            <span>{metric.label}</span>
                            <strong>
                                {metric.currency
                                    ? currencyValue(
                                          getMetric(report, metric.keys)
                                      )
                                    : getMetric(report, metric.keys)}
                            </strong>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function Reports() {
    const [reports, setReports] = useState({});
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState(null);

    const fetchReports = useCallback(async () => {
        setLoading(true);

        const results = await Promise.allSettled(
            Object.entries(reportEndpoints).map(async ([key, endpoint]) => {
                const response = await api.get(endpoint);
                return [key, response.data?.report ?? null];
            })
        );

        const nextReports = {};
        const nextErrors = {};

        results.forEach((result, index) => {
            const key = Object.keys(reportEndpoints)[index];

            if (result.status === "fulfilled") {
                const [reportKey, reportData] = result.value;
                nextReports[reportKey] = reportData;
            } else {
                nextErrors[key] =
                    result.reason?.response?.data?.message ||
                    result.reason?.message ||
                    "Unable to load this report.";
            }
        });

        setReports(nextReports);
        setErrors(nextErrors);
        setLastUpdated(new Date());
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const dailyMetrics = [
        {
            label: "Total Orders",
            keys: ["আজকের মোট অর্ডার"],
        },
        {
            label: "Total Sales",
            keys: ["আজকের মোট বিক্রয় (₹)"],
            currency: true,
        },
        {
            label: "Average Bill",
            keys: ["গড় বিল (₹)"],
            currency: true,
        },
        {
            label: "Items Sold",
            keys: ["মোট বিক্রিত আইটেম"],
        },
    ];

    const monthlyMetrics = [
        {
            label: "Total Orders",
            keys: ["এই মাসের মোট অর্ডার"],
        },
        {
            label: "Total Sales",
            keys: ["এই মাসের মোট বিক্রয় (₹)"],
            currency: true,
        },
        {
            label: "Average Bill",
            keys: ["গড় বিল (₹)"],
            currency: true,
        },
    ];

    const productMetrics = [
        {
            label: "Product",
            keys: ["পণ্যের নাম", "productName", "name"],
        },
        {
            label: "Quantity Sold",
            keys: ["মোট বিক্রি", "totalSold"],
        },
        {
            label: "Total Revenue",
            keys: ["মোট আয় (₹)", "totalRevenue"],
            currency: true,
        },
    ];

    return (
        <div className="reports-page">
            <div className="reports-header">
                <div>
                    <h2>Business Reports</h2>
                    <p>Sales and Product Performance</p>
                    {lastUpdated && (
                        <small>
                            Last updated: {lastUpdated.toLocaleTimeString()}
                        </small>
                    )}
                </div>

                <button
                    className="reports-refresh-button"
                    onClick={fetchReports}
                    disabled={loading}
                >
                    {loading ? "Loading..." : "Refresh Reports"}
                </button>
            </div>

            <div className="reports-grid">
                <ReportCard
                    title="Daily Sales"
                    report={reports.daily}
                    error={errors.daily}
                    loading={loading}
                    metrics={dailyMetrics}
                />

                <ReportCard
                    title="Monthly Sales"
                    report={reports.monthly}
                    error={errors.monthly}
                    loading={loading}
                    metrics={monthlyMetrics}
                />

                <ReportCard
                    title="Best Selling Product"
                    report={reports.best}
                    error={errors.best}
                    loading={loading}
                    metrics={productMetrics}
                />

                <ReportCard
                    title="Least Selling Product"
                    report={reports.least}
                    error={errors.least}
                    loading={loading}
                    metrics={productMetrics}
                />
            </div>
        </div>
    );
}

export default Reports;