const db = require("../config/db");


// OPEN SHOP

exports.openShop = (req, res) => {

    const sql = `
        UPDATE shop_status
        SET
            status = 'OPEN',
            opening_time = NOW(),
            closing_time = NULL
        WHERE id = 1
    `;

    db.query(sql, (err, result) => {

        if (err) {
            return res.status(500).json({
                error: err
            });
        }

        res.json({
            message: "Shop Opened Successfully"
        });

    });

};
// GET SHOP STATUS

exports.getShopStatus = (req, res) => {

    const sql = `
        SELECT *
        FROM shop_status
        WHERE id = 1
    `;

    db.query(sql, (err, result) => {

        if (err) {
            return res.status(500).json({
                error: err
            });
        }

        res.json(result[0]);

    });

};
// CLOSE SHOP

exports.closeShop = (req, res) => {

    const sql = `
        UPDATE shop_status
        SET
            status = 'CLOSED',
            closing_time = NOW()
        WHERE id = 1
    `;

    db.query(sql, (err, result) => {

        if (err) {
            return res.status(500).json({
                error: err
            });
        }

        res.json({
            message: "Shop Closed Successfully"
        });

    });

};