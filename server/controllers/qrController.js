const QRCode = require("qrcode");

// =============================
// GENERATE QR
// =============================

exports.generateQR = async (req, res) => {

    try {

        const { qrCode } = req.params;

        if (!qrCode) {

            return res.status(400).json({

                success: false,
                message: "QR Code Required"

            });

        }

        const qrURL = `http://localhost:5173/order/${qrCode}`;

        const qrImage = await QRCode.toDataURL(qrURL);

        res.json({

            success: true,
            qrCode,
            qrURL,
            qrImage

        });

    }

    catch (err) {

        console.log(err);

        res.status(500).json({

            success: false,
            message: "QR Generation Failed"

        });

    }

};