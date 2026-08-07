const db = require("../config/db");

// ===============================
// Get Emergency Status
// ===============================
exports.getStatus = (req, res) => {

    const sql = `
        SELECT emergency_mode
        FROM whatsapp_settings
        LIMIT 1
    `;

    db.query(sql, (err, result) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: "Database Error"
            });
        }

        res.json({
            success: true,
            emergency_mode: result[0].emergency_mode
        });

    });

};

// ===============================
// Update Emergency Status
// ===============================
exports.toggleEmergency = (req, res) => {

    const { emergency_mode } = req.body;

    const sql = `
        UPDATE whatsapp_settings
        SET emergency_mode = ?
        WHERE id = 1
    `;

    db.query(sql, [emergency_mode], (err) => {

        if (err) {
            return res.status(500).json({
                success: false,
                message: "Database Error"
            });
        }

        res.json({
            success: true,
            message: "Emergency Mode Updated"
        });

    });

};