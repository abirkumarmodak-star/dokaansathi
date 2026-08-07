const db = require("../config/db");

// ==============================
// Add Review
// ==============================

exports.addReview = (req, res) => {

    const {
        order_id,
        customer_id,
        menu_id,
        rating,
        review
    } = req.body;

    const sql = `
        INSERT INTO reviews
        (
            order_id,
            customer_id,
            menu_id,
            rating,
            review
        )
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            order_id,
            customer_id,
            menu_id,
            rating,
            review
        ],
        (err, result) => {

            if (err) {

                console.log(err);

                return res.status(500).json({
                    success: false,
                    message: "Database Error"
                });

            }

            res.status(201).json({

                success: true,

                message: "Review Added Successfully"

            });

        }
    );

};
// ==============================
// Get All Reviews
// ==============================

exports.getReviews = (req, res) => {

const sql = `
    SELECT
        reviews.id,
        reviews.rating,
        reviews.review,
        reviews.created_at,
        customers.name AS customer_name,
        menu.name AS item_name
    FROM reviews
    JOIN customers
        ON reviews.customer_id = customers.id
    JOIN menu
        ON reviews.menu_id = menu.id
    ORDER BY reviews.created_at DESC
`;

    db.query(sql, (err, result) => {

        if (err) {

            console.log(err);

            return res.status(500).json({
                success: false,
                message: "Database Error"
            });

        }

        res.json(result);

    });

};