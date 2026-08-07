const dashboardData = {

    // Summary Cards
    totalRevenue: 18500,

    totalOrders: 42,

    totalBills: 38,

    totalProfit: 6200,

    // Recent Orders
    recentOrders: [

        {
            id: 1,
            token: "TK101",
            customer: "Rahul",
            item: "Chicken Biryani",
            amount: 250,
            status: "Preparing"
        },

        {
            id: 2,
            token: "TK102",
            customer: "Ankit",
            item: "Chola Bhatura",
            amount: 180,
            status: "Ready"
        },

        {
            id: 3,
            token: "TK103",
            customer: "Priya",
            item: "Cold Drink",
            amount: 40,
            status: "Completed"
        },

        {
            id: 4,
            token: "TK104",
            customer: "Amit",
            item: "Paneer Butter Masala",
            amount: 220,
            status: "Pending"
        }

    ],

    // Low Stock Alerts
    lowStock: [

        {
            id: 1,
            name: "Paneer Butter Masala",
            remaining: 3
        },

        {
            id: 2,
            name: "Egg Roll",
            remaining: 0
        }

    ],

    // Top Selling Foods
    topSelling: [

        {
            id: 1,
            name: "Chicken Biryani",
            sold: 20
        },

        {
            id: 2,
            name: "Chola Bhatura",
            sold: 15
        },

        {
            id: 3,
            name: "Cold Drink",
            sold: 12
        }

    ]

};

export default dashboardData;