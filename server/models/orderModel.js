const db = require("../config/db");

const softDeleteOrder = (orderId, actorId, actorRole, callback) => {
    const sql = `
        UPDATE orders
        SET is_deleted = 1,
            deleted_at = CURRENT_TIMESTAMP,
            deleted_by = ?,
            deleted_by_role = ?
        WHERE id = ?
          AND COALESCE(is_deleted, 0) = 0
    `;
    db.query(sql, [actorId, actorRole, orderId], callback);
};

module.exports = { softDeleteOrder };
