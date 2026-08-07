const db = require("../config/db");

// ====================================
// Dashboard Summary
// ====================================

exports.getDashboard = (req, res) => {

    const sql = `

        SELECT

        (SELECT COUNT(*) FROM orders)
        AS totalOrders,

        (SELECT IFNULL(SUM(total_amount),0)
        FROM orders
        WHERE payment_status='Paid')
        AS totalRevenue,

        (SELECT COUNT(*)
        FROM menu)
        AS totalMenu,

        (SELECT COUNT(*)
        FROM orders
        WHERE order_status='Pending')
        AS pendingOrders,

        (SELECT COUNT(*)
        FROM orders
        WHERE order_status='Preparing')
        AS preparingOrders,

        (SELECT COUNT(*)
        FROM orders
        WHERE order_status='Ready')
        AS readyOrders,

        (SELECT COUNT(*)
        FROM orders
        WHERE order_status='Served')
        AS servedOrders,

        (SELECT COUNT(*)
        FROM orders
        WHERE order_status='Cancelled')
        AS cancelledOrders,

        (SELECT COUNT(*)
        FROM inventory
        WHERE current_stock <= reorder_level)
        AS lowStockProducts

    `;

    db.query(sql, (err, result) => {

        if (err) {

            console.log(err);

            return res.status(500).json({

                success: false,
                message: "ড্যাশবোর্ড লোড করা যায়নি"

            });

        }

        const data = result[0];

        res.json({

            success: true,

            message: "ড্যাশবোর্ড সফলভাবে লোড হয়েছে",

            dashboard: {

                "মোট অর্ডার": data.totalOrders,

                "মোট বিক্রয় (₹)": data.totalRevenue,

                "মোট মেনু": data.totalMenu,

                "অপেক্ষমান অর্ডার": data.pendingOrders,

                "রান্না হচ্ছে": data.preparingOrders,

                "প্রস্তুত": data.readyOrders,

                "পরিবেশন সম্পন্ন": data.servedOrders,

                "বাতিল অর্ডার": data.cancelledOrders,

                "কম স্টকের পণ্য": data.lowStockProducts,
                "অপেক্ষমান পেমেন্ট": data.pendingPayments
            }

        });

    });

};