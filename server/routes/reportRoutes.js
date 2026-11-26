const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

const {
    dailySalesReport,
    monthlySalesReport,
    bestSellingProduct,
    lowStockReport,
    leastSellingProduct,
    dailyBestSellingProduct,
    monthlyBestSellingProduct,
    dailyLeastSellingProduct,
    monthlyLeastSellingProduct
} = require("../controllers/reportController");

// =====================================
// REPORT ACCESS: OWNER AND MANAGER ONLY
// =====================================

router.use(
    authMiddleware,
    requireRole("owner", "Owner", "Manager", "manager")
);

// =====================================
// DAILY SALES REPORT
// =====================================

router.get("/daily", dailySalesReport);

// =====================================
// MONTHLY SALES REPORT
// =====================================

router.get("/monthly", monthlySalesReport);
router.get("/best-product", bestSellingProduct);
router.get("/low-stock", lowStockReport);
router.get("/least-product", leastSellingProduct);
router.get("/daily-best-product", dailyBestSellingProduct);
router.get("/monthly-best-product", monthlyBestSellingProduct);
router.get("/daily-least-product", dailyLeastSellingProduct);
router.get("/monthly-least-product", monthlyLeastSellingProduct);
module.exports = router;