const db = require("../config/db");

// =====================================
// DAILY SALES REPORT
// =====================================

exports.dailySalesReport = (req, res) => {

    const sql = `

        SELECT

        COUNT(*) AS totalOrders,

        IFNULL(SUM(total_amount),0) AS totalSales,

        IFNULL(AVG(total_amount),0) AS averageBill,

        (
            SELECT IFNULL(SUM(quantity),0)
            FROM order_items
        ) AS totalItemsSold

        FROM orders

        WHERE DATE(created_at)=CURDATE()

        AND payment_status='Paid'

    `;

    db.query(sql, (err, result) => {

        if (err) {

            console.log(err);

            return res.status(500).json({

                success: false,

                message: "আজকের রিপোর্ট লোড করা যায়নি"

            });

        }

        const data = result[0];

        res.json({

            success: true,

            message: "আজকের বিক্রয় রিপোর্ট",

            report: {

                "আজকের মোট অর্ডার": data.totalOrders,

                "আজকের মোট বিক্রয় (₹)": data.totalSales,

                "গড় বিল (₹)": Number(data.averageBill).toFixed(2),

                "মোট বিক্রিত আইটেম": data.totalItemsSold

            }

        });

    });

};
// =====================================
// MONTHLY SALES REPORT
// =====================================

exports.monthlySalesReport = (req, res) => {

    const sql = `

        SELECT

        COUNT(*) AS totalOrders,

        IFNULL(SUM(total_amount),0) AS totalSales,

        IFNULL(AVG(total_amount),0) AS averageBill

        FROM orders

        WHERE MONTH(created_at)=MONTH(CURDATE())

        AND YEAR(created_at)=YEAR(CURDATE())

        AND payment_status='Paid'

    `;

    db.query(sql, (err, result) => {

        if (err) {

            console.log(err);

            return res.status(500).json({

                success: false,

                message: "মাসিক রিপোর্ট লোড করা যায়নি"

            });

        }

        const data = result[0];

        res.json({

            success: true,

            message: "এই মাসের বিক্রয় রিপোর্ট",

            report: {

                "এই মাসের মোট অর্ডার": data.totalOrders,

                "এই মাসের মোট বিক্রয় (₹)": data.totalSales,

                "গড় বিল (₹)": Number(data.averageBill).toFixed(2)

            }

        });

    });

};
// =====================================
// BEST SELLING PRODUCT REPORT
// =====================================

exports.bestSellingProduct = (req, res) => {

    const sql = `
        SELECT
            m.name AS productName,
            SUM(oi.quantity) AS totalSold,
            SUM(oi.subtotal) AS totalRevenue
        FROM order_items oi
        JOIN menu m
            ON oi.menu_id = m.id
        GROUP BY oi.menu_id
        ORDER BY totalSold DESC
        LIMIT 1
    `;

    db.query(sql, (err, result) => {

        if (err) {

            console.log(err);

            return res.status(500).json({

                success: false,

                message: "রিপোর্ট লোড করা যায়নি"

            });

        }

        if (result.length === 0) {

            return res.json({

                success: true,

                message: "কোনো বিক্রয়ের তথ্য পাওয়া যায়নি"

            });

        }

        const data = result[0];

        res.json({

            success: true,

            message: "সবচেয়ে বেশি বিক্রি হওয়া পণ্য",

            report: {

                "পণ্যের নাম": data.productName,

                "মোট বিক্রি": data.totalSold,

                "মোট আয় (₹)": data.totalRevenue

            }

        });

    });

};
// =====================================
// LOW STOCK ALERT REPORT
// =====================================

exports.lowStockReport = (req, res) => {

    const sql = `
        SELECT
            m.name AS productName,
            i.current_stock,
            i.reorder_level
        FROM inventory i
        JOIN menu m
            ON i.menu_id = m.id
        WHERE i.current_stock <= i.reorder_level
        ORDER BY i.current_stock ASC
    `;

    db.query(sql, (err, result) => {

        if (err) {

            console.log(err);

            return res.status(500).json({

                success: false,

                message: "লো স্টক রিপোর্ট লোড করা যায়নি"

            });

        }

        if (result.length === 0) {

            return res.json({

                success: true,

                message: "সব পণ্যের স্টক পর্যাপ্ত আছে",

                products: []

            });

        }

        res.json({

            success: true,

            message: "লো স্টক রিপোর্ট",

            totalLowStockProducts: result.length,

            products: result

        });

    });

};
// =====================================
// LEAST SELLING PRODUCT REPORT
// =====================================

exports.leastSellingProduct = (req, res) => {

    const sql = `
        SELECT
            m.name AS productName,
            SUM(oi.quantity) AS totalSold,
            SUM(oi.subtotal) AS totalRevenue
        FROM order_items oi
        JOIN menu m
            ON oi.menu_id = m.id
        GROUP BY oi.menu_id
        ORDER BY totalSold ASC
        LIMIT 1
    `;

    db.query(sql, (err, result) => {

        if (err) {

            console.log(err);

            return res.status(500).json({
                success: false,
                message: "রিপোর্ট লোড করা যায়নি"
            });

        }

        if (result.length === 0) {

            return res.json({
                success: true,
                message: "কোনো বিক্রয়ের তথ্য পাওয়া যায়নি"
            });

        }

        const data = result[0];

        res.json({

            success: true,

            message: "সবচেয়ে কম বিক্রি হওয়া পণ্য",

            report: {

                "পণ্যের নাম": data.productName,

                "মোট বিক্রি": data.totalSold,

                "মোট আয় (₹)": data.totalRevenue

            }

        });

    });

};
// =====================================
// DAILY BEST SELLING PRODUCT
// =====================================

exports.dailyBestSellingProduct = (req, res) => {

    const sql = `
        SELECT
            m.name AS productName,
            SUM(oi.quantity) AS totalSold,
            SUM(oi.subtotal) AS totalRevenue
        FROM order_items oi
        JOIN menu m
            ON oi.menu_id = m.id
        JOIN orders o
            ON oi.order_id = o.id
        WHERE DATE(o.created_at) = CURDATE()
        GROUP BY oi.menu_id
        ORDER BY totalSold DESC
        LIMIT 1
    `;

    db.query(sql, (err, result) => {

        if (err) {

            console.log(err);

            return res.status(500).json({
                success: false,
                message: "আজকের রিপোর্ট লোড করা যায়নি"
            });

        }

        if (result.length === 0) {

            return res.json({
                success: true,
                message: "আজ কোনো বিক্রয় হয়নি"
            });

        }

        res.json({

            success: true,

            message: "আজ সবচেয়ে বেশি বিক্রি হওয়া পণ্য",

            report: result[0]

        });

    });

};
// =====================================
// MONTHLY BEST SELLING PRODUCT
// =====================================

exports.monthlyBestSellingProduct = (req, res) => {

    const sql = `
        SELECT
            m.name AS productName,
            SUM(oi.quantity) AS totalSold,
            SUM(oi.subtotal) AS totalRevenue
        FROM order_items oi
        JOIN menu m
            ON oi.menu_id = m.id
        JOIN orders o
            ON oi.order_id = o.id
        WHERE
            MONTH(o.created_at) = MONTH(CURDATE())
            AND YEAR(o.created_at) = YEAR(CURDATE())
            AND o.payment_status = 'Paid'
        GROUP BY oi.menu_id
        ORDER BY totalSold DESC
        LIMIT 1
    `;

    db.query(sql, (err, result) => {

        if (err) {

            console.log(err);

            return res.status(500).json({

                success: false,

                message: "মাসিক রিপোর্ট লোড করা যায়নি"

            });

        }

        if (result.length === 0) {

            return res.json({

                success: true,

                message: "এই মাসে কোনো বিক্রয় হয়নি"

            });

        }

        res.json({

            success: true,

            message: "এই মাসে সবচেয়ে বেশি বিক্রি হওয়া পণ্য",

            report: result[0]

        });

    });

};
// =====================================
// DAILY LEAST SELLING PRODUCT
// =====================================

exports.dailyLeastSellingProduct = (req, res) => {

    const sql = `
        SELECT
            m.name AS productName,
            SUM(oi.quantity) AS totalSold,
            SUM(oi.subtotal) AS totalRevenue
        FROM order_items oi
        JOIN menu m
            ON oi.menu_id = m.id
        JOIN orders o
            ON oi.order_id = o.id
        WHERE
            DATE(o.created_at) = CURDATE()
            AND o.payment_status = 'Paid'
        GROUP BY oi.menu_id
        ORDER BY totalSold ASC
        LIMIT 1
    `;

    db.query(sql, (err, result) => {

        if (err) {

            console.log(err);

            return res.status(500).json({

                success: false,

                message: "আজকের রিপোর্ট লোড করা যায়নি"

            });

        }

        if (result.length === 0) {

            return res.json({

                success: true,

                message: "আজ কোনো বিক্রয় হয়নি"

            });

        }

        res.json({

            success: true,

            message: "আজ সবচেয়ে কম বিক্রি হওয়া পণ্য",

            report: result[0]

        });

    });

};
// =====================================
// MONTHLY LEAST SELLING PRODUCT
// =====================================

exports.monthlyLeastSellingProduct = (req, res) => {

    const sql = `
        SELECT
            m.name AS productName,
            SUM(oi.quantity) AS totalSold,
            SUM(oi.subtotal) AS totalRevenue
        FROM order_items oi
        JOIN menu m
            ON oi.menu_id = m.id
        JOIN orders o
            ON oi.order_id = o.id
        WHERE
            MONTH(o.created_at) = MONTH(CURDATE())
            AND YEAR(o.created_at) = YEAR(CURDATE())
            AND o.payment_status = 'Paid'
        GROUP BY oi.menu_id
        ORDER BY totalSold ASC
        LIMIT 1
    `;

    db.query(sql, (err, result) => {

        if (err) {

            console.log(err);

            return res.status(500).json({

                success: false,

                message: "মাসিক রিপোর্ট লোড করা যায়নি"

            });

        }

        if (result.length === 0) {

            return res.json({

                success: true,

                message: "এই মাসে কোনো বিক্রয় হয়নি"

            });

        }

        res.json({

            success: true,

            message: "এই মাসে সবচেয়ে কম বিক্রি হওয়া পণ্য",

            report: result[0]

        });

    });

};