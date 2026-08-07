const express = require("express");

const router = express.Router();

const {
    addReview,
    getReviews
} = require("../controllers/reviewController");

// ==============================
// Add Review
// ==============================
router.get(
    "/",
    getReviews
);
router.post(
    "/",
    addReview
);

module.exports = router;