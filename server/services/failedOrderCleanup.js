"use strict";

function invoke(target, method, ...args) {
    return new Promise((resolve, reject) => {
        try {
            target[method](...args, (error, result) => error ? reject(error) : resolve(result));
        } catch (error) {
            reject(error);
        }
    });
}

async function cleanupFailedOrder(pool, orderId) {
    const connection = await invoke(pool, "getConnection");
    let transactionStarted = false;
    let safeToRelease = false;
    let primaryError;
    try {
        await invoke(connection, "beginTransaction");
        transactionStarted = true;
        await invoke(connection, "query", "DELETE FROM order_items WHERE order_id = ?", [orderId]);
        await invoke(connection, "query", "DELETE FROM order_tracking_capabilities WHERE order_id = ?", [orderId]);
        await invoke(connection, "query", "DELETE FROM orders WHERE id = ?", [orderId]);
        await invoke(connection, "commit");
        transactionStarted = false;
        safeToRelease = true;
    } catch (error) {
        primaryError = error;
        if (transactionStarted) {
            try {
                await invoke(connection, "rollback");
                transactionStarted = false;
                safeToRelease = true;
            } catch (rollbackError) {
                error.rollbackError = rollbackError;
            }
        }
    } finally {
        if (!safeToRelease) {
            try {
                if (typeof connection.destroy !== "function") throw new Error("Order cleanup connection cannot be safely destroyed.");
                connection.destroy();
            } catch (destroyError) {
                if (primaryError) primaryError.destroyError = destroyError;
                else primaryError = destroyError;
            }
        } else {
            try {
                connection.release();
            } catch (releaseError) {
                if (!primaryError) primaryError = releaseError;
                else primaryError.releaseError = releaseError;
                try {
                    if (typeof connection.destroy !== "function") throw new Error("Order cleanup connection cannot be safely destroyed.");
                    connection.destroy();
                } catch (destroyError) {
                    primaryError.destroyError = destroyError;
                }
            }
        }
    }
    if (primaryError) throw primaryError;
}

module.exports = { cleanupFailedOrder };
