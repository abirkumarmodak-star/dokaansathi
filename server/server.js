const express = require("express");
const cors = require("cors");
const path = require("path");
const {
    checkDeliveryAssignmentEscalation
} = require("./services/deliveryEscalationService");
// ======================================================
// LOAD ENVIRONMENT VARIABLES
// ======================================================

require("dotenv").config({
    path: path.join(__dirname, ".env")
});

console.log("====================================");
console.log("🔥 DOKAANSATHI SERVER STARTING...");
console.log("====================================");

console.log("DB HOST:", process.env.DB_HOST);
console.log("DB USER:", process.env.DB_USER);
console.log("DB NAME:", process.env.DB_NAME);
console.log("DB PORT:", process.env.DB_PORT);
console.log("PASSWORD EXISTS:", !!process.env.DB_PASSWORD);

// ======================================================
// DATABASE
// ======================================================

const db = require("./config/db");

console.log("✅ DATABASE MODULE LOADED");

// ======================================================
// ROUTES
// ======================================================

const customerRoutes = require("./routes/customerRoutes");
const menuRoutes = require("./routes/menuRoutes");
const orderRoutes = require("./routes/orderRoutes");
const tableRoutes = require("./routes/tableRoutes");
const orderItemRoutes = require("./routes/orderItemRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const shopRoutes = require("./routes/shopRoutes");
const userRoutes = require("./routes/userRoutes");
const billingRoutes = require("./routes/billingRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const reportRoutes = require("./routes/reportRoutes");
const pushRoutes = require("./routes/pushRoutes");
const geocodingRoutes = require("./routes/geocodingRoutes");

console.log(
    "🔥 GEOCODING ROUTES FILE =",
    require.resolve("./routes/geocodingRoutes")
);

const shopSettingsRoutes = require("./routes/shopSettingsRoutes");
const staffRoutes = require("./routes/staffRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const whatsappRoutes = require("./routes/whatsappRoutes");
const alertRoutes = require("./routes/alertRoutes");
const restaurantTableRoutes = require("./routes/restaurantTableRoutes");
const qrRoutes = require("./routes/qrRoutes");
const deliveryAssignmentRoutes = require("./routes/deliveryAssignmentRoutes");

// ======================================================
// SERVICES
// ======================================================

const {
    checkPendingOrders
} = require("./services/alertEngine");

console.log("✅ ALL ROUTES/SERVICES LOADED");

// ======================================================
// CREATE APP
// ======================================================

const app = express();

// ======================================================
// MIDDLEWARE
// ======================================================

app.use(cors());

app.use(express.json());

console.log(
    "🔥🔥🔥 GLOBAL SERVER MIDDLEWARE EXECUTED 🔥🔥🔥"
);

// ======================================================
// DEBUG MIDDLEWARE
// ======================================================

app.use((req, res, next) => {

    console.log("\n==============================");
    console.log("REQUEST RECEIVED");
    console.log("METHOD :", req.method);
    console.log("URL    :", req.originalUrl);
    console.log("BODY   :", req.body);
    console.log("==============================\n");

    next();
});

// ======================================================
// HOME
// ======================================================

app.get("/", (req, res) => {

    res.send(
        "Welcome to DokaanSathi AI Backend"
    );

});

// ======================================================
// HEALTH CHECK
// ======================================================

app.get("/api/health", (req, res) => {

    console.log(
        "🔥🔥🔥 HEALTH ROUTE HIT 🔥🔥🔥"
    );

    res.json({

        success: true,

        status: "CURRENT SERVER",

        debugId: "DOKAANSATHI_SERVER_2026"

    });

});

// ======================================================
// API ROUTES
// ======================================================

console.log("🔥 REGISTERING API ROUTES...");

// ------------------------------------------------------
// CUSTOMER
// ------------------------------------------------------

app.use(
    "/api/customers",
    customerRoutes
);

console.log("✅ /api/customers registered");

// ------------------------------------------------------
// MENU
// ------------------------------------------------------

app.use(
    "/api/menu",
    menuRoutes
);

console.log("✅ /api/menu registered");

// ------------------------------------------------------
// GEOCODING
// ------------------------------------------------------

app.use(
    "/api/geocode",
    geocodingRoutes
);

console.log("✅ /api/geocode registered");

// ------------------------------------------------------
// ORDERS
// ------------------------------------------------------

console.log(
    "🔥 ORDER ROUTE REGISTERING..."
);

console.log(
    "orderRoutes type:",
    typeof orderRoutes
);

app.use(
    "/api/orders",
    orderRoutes
);

console.log(
    "🔥 ORDER ROUTE REGISTERED..."
);

// ------------------------------------------------------
// ORDER ITEMS
// ------------------------------------------------------

app.use(
    "/api/order-items",
    orderItemRoutes
);

console.log(
    "✅ /api/order-items registered"
);

// ------------------------------------------------------
// TABLES
// ------------------------------------------------------

app.use(
    "/api/tables",
    tableRoutes
);

console.log(
    "✅ /api/tables registered"
);

// ------------------------------------------------------
// INVENTORY
// ------------------------------------------------------

app.use(
    "/api/inventory",
    inventoryRoutes
);

console.log(
    "✅ /api/inventory registered"
);

// ------------------------------------------------------
// SHOP
// ------------------------------------------------------

app.use(
    "/api/shop",
    shopRoutes
);

console.log(
    "✅ /api/shop registered"
);

// ------------------------------------------------------
// USERS
// ------------------------------------------------------

app.use(
    "/api/users",
    userRoutes
);

console.log(
    "✅ /api/users registered"
);

// ------------------------------------------------------
// BILLING
// ------------------------------------------------------

app.use(
    "/api/billing",
    billingRoutes
);

console.log(
    "✅ /api/billing registered"
);

// ------------------------------------------------------
// DASHBOARD
// ------------------------------------------------------

app.use(
    "/api/dashboard",
    dashboardRoutes
);

console.log(
    "✅ /api/dashboard registered"
);

// ------------------------------------------------------
// REPORTS
// ------------------------------------------------------

app.use(
    "/api/reports",
    reportRoutes
);

console.log(
    "✅ /api/reports registered"
);

// ------------------------------------------------------
// SHOP SETTINGS
// ------------------------------------------------------

app.use(
    "/api/shop-settings",
    shopSettingsRoutes
);

console.log(
    "✅ /api/shop-settings registered"
);

// ------------------------------------------------------
// STAFF
// ------------------------------------------------------

app.use(
    "/api/staff",
    staffRoutes
);

console.log(
    "✅ /api/staff registered"
);

// ------------------------------------------------------
// REVIEWS
// ------------------------------------------------------

app.use(
    "/api/reviews",
    reviewRoutes
);

console.log(
    "✅ /api/reviews registered"
);

// ------------------------------------------------------
// WHATSAPP
// ------------------------------------------------------

app.use(
    "/api/whatsapp",
    whatsappRoutes
);

console.log(
    "✅ /api/whatsapp registered"
);

// ------------------------------------------------------
// ALERTS
// ------------------------------------------------------

app.use(
    "/api/alerts",
    alertRoutes
);

console.log(
    "✅ /api/alerts registered"
);

// ------------------------------------------------------
// RESTAURANT TABLES
// ------------------------------------------------------

app.use(
    "/api/restaurant-tables",
    restaurantTableRoutes
);

console.log(
    "✅ /api/restaurant-tables registered"
);

// ------------------------------------------------------
// QR
// ------------------------------------------------------

app.use(
    "/api/qr",
    qrRoutes
);

console.log(
    "✅ /api/qr registered"
);

// ------------------------------------------------------
// DELIVERY ASSIGNMENTS
// ------------------------------------------------------

app.use(
    "/api/delivery-assignments",
    deliveryAssignmentRoutes
);
app.use("/api/push", pushRoutes);
console.log(
    "✅ /api/delivery-assignments registered"
);

// ======================================================
// STAFF TEST ROUTE
// ======================================================

app.get("/api/staff-test", (req, res) => {

    console.log(
        "🔥 STAFF TEST ROUTE HIT"
    );

    res.json({

        success: true,

        message:
            "Staff test route working"

    });

});

// ======================================================
// DELIVERY BOY AUTO OFFLINE CHECK
// ======================================================

const checkDeliveryBoyOffline = () => {

    const sql = `

        UPDATE staff

        SET online_status = 'Offline'

        WHERE role = 'DeliveryBoy'

        AND status = 'Active'

        AND online_status = 'Online'

        AND last_seen IS NOT NULL

        AND last_seen < DATE_SUB(
            NOW(),
            INTERVAL 60 SECOND
        )

    `;

    db.query(
        sql,
        (err, result) => {

            if (err) {

                console.error(
                    "❌ DELIVERY OFFLINE CHECK ERROR:",
                    err
                );

                return;

            }

            if (
                result.affectedRows > 0
            ) {

                console.log(
                    "🔴 DELIVERY BOY AUTO OFFLINE:",
                    result.affectedRows
                );

            }

        }
    );

};

// ======================================================
// 404 HANDLER
// ======================================================

app.use(
    (req, res) => {

        console.log(
            "❌ 404 ROUTE NOT FOUND:",
            req.method,
            req.originalUrl
        );

        res.status(404).json({

            success: false,

            message: "Route Not Found",

            method: req.method,

            route: req.originalUrl

        });

    }
);

// ======================================================
// ERROR HANDLER
// ======================================================

app.use(
    (err, req, res, next) => {

        console.error(
            "❌❌❌ EXPRESS ERROR ❌❌❌"
        );

        console.error(err);

        res.status(500).json({

            success: false,

            message: "Internal Server Error",

            error: err.message

        });

    }
);

// ======================================================
// START SERVER
// ======================================================

const PORT =
    process.env.PORT || 5000;

console.log(
    "🚨 ABOUT TO START SERVER..."
);

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            "===================================="
        );

        console.log(
            `🚀 SERVER RUNNING ON PORT ${PORT}`
        );

        console.log(
            `🌐 http://localhost:${PORT}`
        );

        console.log(
            `❤️  http://localhost:${PORT}/api/health`
        );

        console.log(
            `📍 http://localhost:${PORT}/api/geocode?address=TEST123`
        );

        console.log(
            "===================================="
        );

        console.log(
            "✅ MySQL Connected Successfully"
        );

        console.log(
            "✅ Smart Alert Engine Started"
        );

    }
);

// ======================================================
// BACKGROUND TIMER
// ======================================================

setInterval(
    () => {

        console.log(
            "⏰ Background Timer Running"
        );

        checkPendingOrders();

        checkDeliveryBoyOffline();

        checkDeliveryAssignmentEscalation();

    },
    30000
);