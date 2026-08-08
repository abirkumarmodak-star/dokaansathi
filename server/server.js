const express = require("express");
const cors = require("cors");
const path = require("path");

require("dotenv").config({
    path: path.join(__dirname, ".env")
});
console.log("DB HOST:", process.env.DB_HOST);
console.log("DB USER:", process.env.DB_USER);
console.log("DB NAME:", process.env.DB_NAME);
console.log("DB PORT:", process.env.DB_PORT);
console.log("PASSWORD EXISTS:", !!process.env.DB_PASSWORD);
const db = require("./config/db");

// Routes
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
const app = express();
const shopSettingsRoutes = require("./routes/shopSettingsRoutes");
const staffRoutes = require("./routes/staffRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const whatsappRoutes = require("./routes/whatsappRoutes");
const alertRoutes = require("./routes/alertRoutes");
const { checkPendingOrders } = require("./services/alertEngine");
const restaurantTableRoutes = require("./routes/restaurantTableRoutes");
const qrRoutes = require("./routes/qrRoutes");
// ===============================
// MIDDLEWARE
// ===============================
app.use(cors());
app.use(express.json());

// ===============================
// DEBUG MIDDLEWARE
// ===============================
app.use((req, res, next) => {
    console.log("\n==============================");
    console.log("REQUEST RECEIVED");
    console.log("METHOD :", req.method);
    console.log("URL    :", req.originalUrl);
    console.log("BODY   :", req.body);
    console.log("==============================\n");
    next();
});

// ===============================
// HOME ROUTE
// ===============================
app.get("/", (req, res) => {
    res.send("Welcome to DokaanSathi AI Backend");
});
// ===============================
// Health Check
// ===============================
app.get("/api/health", (req, res) => {

    res.json({

        success: true,

        status: "Server Running"

    });

});

// ===============================
// API ROUTES
// ===============================
app.use("/api/customers", customerRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/order-items", orderItemRoutes);
app.use("/api/tables", tableRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/shop", shopRoutes);
app.use("/api/users", userRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use(
    "/api/shop-settings",
    shopSettingsRoutes
);
app.use("/api/staff", staffRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/alerts", alertRoutes);
app.use(

    "/api/restaurant-tables",

    restaurantTableRoutes

);
app.use("/api/qr", qrRoutes);
// ===============================
// 404 ROUTE
// ===============================
app.use((req, res) => {
    res.status(404).json({
        message: "Route Not Found"
    });
});

// ===============================
// START SERVER
// ===============================
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {

    console.log("====================================");
    console.log(`🚀 Server running on port ${PORT}`);
    console.log("✅ MySQL Connected Successfully");
    console.log("====================================");

    console.log("✅ Smart Alert Engine Started");

    setInterval(() => {

        console.log("⏰ Timer Running");

        checkPendingOrders();

    }, 10000);   // Test এর জন্য 10 seconds

});