const db = require("../config/db");
const QRCode = require("qrcode");

// ======================================
// GET ALL TABLES
// ======================================

exports.getTables = async (req, res) => {

    console.log("GET TABLES API RUNNING");

    const sql = `
        SELECT *
        FROM restaurant_tables
        ORDER BY table_number ASC
    `;

    db.query(sql, async (err, results) => {

        if (err) {

            console.log(err);

            return res.status(500).json({

                success: false,
                message: "Database Error"

            });

        }

        try {

            const tables = await Promise.all(

                results.map(async (table) => {

                    const qrURL = `http://localhost:5173/order/${table.qr_code}`;

                    const qrImage = await QRCode.toDataURL(qrURL);

                    return {

                        ...table,

                        qr_url: qrURL,

                        qr_image: qrImage

                    };

                })

            );

            return res.status(200).json({

                success: true,

                tables

            });

        }

        catch (error) {

            console.log(error);

            return res.status(500).json({

                success: false,
                message: "QR Generation Failed"

            });

        }

    });

};

// ======================================
// GET SINGLE TABLE
// ======================================

exports.getTableById = (req, res) => {

    console.log("GET SINGLE TABLE API RUNNING");

    const { id } = req.params;

    const sql = `
        SELECT *
        FROM restaurant_tables
        WHERE id = ?
    `;

    db.query(sql, [id], (err, results) => {

        if (err) {

            console.log(err);

            return res.status(500).json({

                success: false,
                message: "Database Error"

            });

        }

        if (results.length === 0) {

            return res.status(404).json({

                success: false,
                message: "Table Not Found"

            });

        }

        return res.status(200).json({

            success: true,

            table: results[0]

        });

    });

};

// ======================================
// GET TABLE BY QR CODE
// ======================================

exports.getTableByQR = (req, res) => {

    console.log("GET TABLE BY QR API RUNNING");

    const { qrCode } = req.params;

    const sql = `
        SELECT *
        FROM restaurant_tables
        WHERE qr_code = ?
    `;

    db.query(sql, [qrCode], (err, results) => {

        if (err) {

            console.log(err);

            return res.status(500).json({

                success: false,
                message: "Database Error"

            });

        }

        if (results.length === 0) {

            return res.status(404).json({

                success: false,
                message: "Invalid QR Code"

            });

        }

        return res.status(200).json({

            success: true,

            table: results[0]

        });

    });

};