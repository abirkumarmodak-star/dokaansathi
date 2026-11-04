
const db = require("../config/db");

const {
    sendPushToDeliveryBoy
} = require("./deliveryPushService");

const REMINDER_MINUTES = 5;
const ESCALATION_MINUTES = 5;
const IST_OFFSET_MINUTES = 330;

const query = (connection, sql, params = []) =>
    new Promise((resolve, reject) => {
        connection.query(sql, params, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });

const withTransaction = async (callback) => {
    const connection = await new Promise((resolve, reject) => {
        db.getConnection((err, conn) => {
            if (err) return reject(err);
            resolve(conn);
        });
    });

    try {
        await new Promise((resolve, reject) => {
            connection.beginTransaction(err =>
                err ? reject(err) : resolve()
            );
        });

        const result = await callback(connection);

        await new Promise((resolve, reject) => {
            connection.commit(err =>
                err ? reject(err) : resolve()
            );
        });

        return result;
    } catch (err) {
        try {
            await new Promise((resolve, reject) => {
                connection.rollback(rollbackErr =>
                    rollbackErr ? reject(rollbackErr) : resolve()
                );
            });
        } catch (rollbackError) {
            console.error("❌ TRANSACTION ROLLBACK ERROR:", rollbackError);
        }

        throw err;
    } finally {
        connection.release();
    }
};

const isActiveOrder = (order) =>
    order &&
    order.order_type === "Delivery" &&
    !["Completed", "Cancelled"].includes(order.order_status);

// ======================================================
// STEP 1: REMINDER AFTER 5 MINUTES
// ======================================================

const processReminders = async () => {
    let candidates;

    try {
        candidates = await query(
            db,
            `
                SELECT
                    aa.id AS attempt_id,
                    aa.order_id,
                    aa.delivery_boy_id,
                    aa.attempt_no,
                    da.id AS assignment_id
                FROM delivery_assignment_attempts aa
                INNER JOIN delivery_assignments da
                    ON da.order_id = aa.order_id
                WHERE aa.status = 'Assigned'
                  AND aa.reminded_at IS NULL
                  AND da.status = 'Assigned'
                  AND aa.assigned_at <= DATE_SUB(
                      UTC_TIMESTAMP(),
                      INTERVAL ? MINUTE
                  )
                  AND NOT EXISTS (
                      SELECT 1
                      FROM delivery_assignment_attempts newer
                      WHERE newer.order_id = aa.order_id
                        AND (
                            newer.attempt_no > aa.attempt_no
                            OR (
                                newer.attempt_no = aa.attempt_no
                                AND newer.id > aa.id
                            )
                        )
                  )
                ORDER BY aa.assigned_at ASC
            `,
            [REMINDER_MINUTES]
        );
    } catch (err) {
        console.error("❌ REMINDER CANDIDATE QUERY ERROR:", err);
        return;
    }

    for (const candidate of candidates) {
        try {
            const claimed = await withTransaction(async connection => {
                // Lock order consistently after assignment and attempt.
                const assignments = await query(
                    connection,
                    `
                        SELECT id, order_id, delivery_boy_id, status
                        FROM delivery_assignments
                        WHERE id = ?
                        FOR UPDATE
                    `,
                    [candidate.assignment_id]
                );

                if (!assignments.length) return false;

                const assignment = assignments[0];

                if (
                    assignment.status !== "Assigned" ||
                    Number(assignment.delivery_boy_id) !==
                        Number(candidate.delivery_boy_id)
                ) {
                    return false;
                }

                const attempts = await query(
                    connection,
                    `
                        SELECT *
                        FROM delivery_assignment_attempts
                        WHERE id = ?
                        FOR UPDATE
                    `,
                    [candidate.attempt_id]
                );

                if (!attempts.length) return false;

                const attempt = attempts[0];

                if (
                    attempt.status !== "Assigned" ||
                    attempt.reminded_at !== null ||
                    Number(attempt.delivery_boy_id) !==
                        Number(candidate.delivery_boy_id)
                ) {
                    return false;
                }

                const latest = await query(
                    connection,
                    `
                        SELECT id
                        FROM delivery_assignment_attempts
                        WHERE order_id = ?
                        ORDER BY attempt_no DESC, id DESC
                        LIMIT 1
                    `,
                    [candidate.order_id]
                );

                if (
                    !latest.length ||
                    Number(latest[0].id) !== Number(candidate.attempt_id)
                ) {
                    return false;
                }

                const orders = await query(
                    connection,
                    `
                        SELECT id, order_type, order_status
                        FROM orders
                        WHERE id = ?
                        FOR UPDATE
                    `,
                    [candidate.order_id]
                );

                if (!isActiveOrder(orders[0])) return false;

                const elapsed = await query(
                    connection,
                    `
                        SELECT
                            assigned_at <= DATE_SUB(
                                UTC_TIMESTAMP(),
                                INTERVAL ? MINUTE
                            ) AS ready
                        FROM delivery_assignment_attempts
                        WHERE id = ?
                    `,
                    [REMINDER_MINUTES, candidate.attempt_id]
                );

                if (!elapsed[0] || !elapsed[0].ready) return false;

                const result = await query(
                    connection,
                    `
                        UPDATE delivery_assignment_attempts
                        SET status = 'Reminded',
                            reminded_at = UTC_TIMESTAMP()
                        WHERE id = ?
                          AND status = 'Assigned'
                          AND reminded_at IS NULL
                    `,
                    [candidate.attempt_id]
                );

                return result.affectedRows === 1;
            });

            if (!claimed) continue;

            let pushResult;

            try {
                pushResult = await sendPushToDeliveryBoy(
                    candidate.delivery_boy_id,
                    {
                        orderId: candidate.order_id,
                        assignmentId: candidate.assignment_id,
                        attemptNo: candidate.attempt_no,
                        title: "🚚 Delivery Reminder",
                        body: `Order #${candidate.order_id} is still waiting for your acceptance.`,
                        tag: `delivery-reminder-${candidate.order_id}-attempt-${candidate.attempt_no}`,
                        url: "/staff-dashboard"
                    }
                );
            } catch (pushError) {
                console.error("❌ REMINDER PUSH ERROR:", pushError);
            }

            console.log("📨 REMINDER PUSH RESULT:", pushResult);

            if (!pushResult || pushResult.success !== true) {
                // Retry only if the same attempt is still active.
                try {
                    await withTransaction(async connection => {
                        const assignments = await query(
                            connection,
                            `
                                SELECT id, status, delivery_boy_id
                                FROM delivery_assignments
                                WHERE id = ?
                                FOR UPDATE
                            `,
                            [candidate.assignment_id]
                        );

                        if (
                            !assignments.length ||
                            assignments[0].status !== "Assigned" ||
                            Number(assignments[0].delivery_boy_id) !==
                                Number(candidate.delivery_boy_id)
                        ) {
                            return;
                        }

                        const attempts = await query(
                            connection,
                            `
                                SELECT id, status
                                FROM delivery_assignment_attempts
                                WHERE id = ?
                                FOR UPDATE
                            `,
                            [candidate.attempt_id]
                        );

                        if (
                            !attempts.length ||
                            attempts[0].status !== "Reminded"
                        ) {
                            return;
                        }

                        await query(
                            connection,
                            `
                                UPDATE delivery_assignment_attempts
                                SET status = 'Assigned',
                                    reminded_at = NULL
                                WHERE id = ?
                                  AND status = 'Reminded'
                            `,
                            [candidate.attempt_id]
                        );
                    });

                    console.log(
                        "↩️ REMINDER PUSH FAILED — RETRY ENABLED",
                        candidate.order_id
                    );
                } catch (retryError) {
                    console.error(
                        "❌ REMINDER RETRY RESET ERROR:",
                        retryError
                    );
                }
            }
        } catch (err) {
            console.error(
                "❌ REMINDER PROCESS ERROR:",
                candidate.order_id,
                err
            );
        }
    }
};

// ======================================================
// STEP 2: REASSIGN AFTER 5 MINUTES FROM REMINDER
// ======================================================

const processEscalations = async () => {
    let candidates;

    try {
        candidates = await query(
            db,
            `
                SELECT
                    aa.id AS attempt_id,
                    aa.order_id,
                    aa.delivery_boy_id,
                    aa.attempt_no,
                    da.id AS assignment_id
                FROM delivery_assignment_attempts aa
                INNER JOIN delivery_assignments da
                    ON da.order_id = aa.order_id
                WHERE aa.status = 'Reminded'
                  AND aa.reminded_at IS NOT NULL
                  AND da.status = 'Assigned'
                  AND aa.reminded_at <= DATE_SUB(
                      UTC_TIMESTAMP(),
                      INTERVAL ? MINUTE
                  )
                  AND NOT EXISTS (
                      SELECT 1
                      FROM delivery_assignment_attempts newer
                      WHERE newer.order_id = aa.order_id
                        AND (
                            newer.attempt_no > aa.attempt_no
                            OR (
                                newer.attempt_no = aa.attempt_no
                                AND newer.id > aa.id
                            )
                        )
                  )
                ORDER BY aa.reminded_at ASC
            `,
            [ESCALATION_MINUTES]
        );
    } catch (err) {
        console.error("❌ ESCALATION CANDIDATE QUERY ERROR:", err);
        return;
    }

    for (const candidate of candidates) {
        let result;

        try {
            result = await withTransaction(async connection => {
                // Same lock order as acceptDelivery:
                // assignment first, then latest attempt.
                const assignments = await query(
                    connection,
                    `
                        SELECT id, order_id, delivery_boy_id, status
                        FROM delivery_assignments
                        WHERE id = ?
                        FOR UPDATE
                    `,
                    [candidate.assignment_id]
                );

                if (!assignments.length) return null;

                const assignment = assignments[0];

                if (
                    assignment.status !== "Assigned" ||
                    Number(assignment.delivery_boy_id) !==
                        Number(candidate.delivery_boy_id)
                ) {
                    return null;
                }

                const attempts = await query(
                    connection,
                    `
                        SELECT *
                        FROM delivery_assignment_attempts
                        WHERE id = ?
                        FOR UPDATE
                    `,
                    [candidate.attempt_id]
                );

                if (!attempts.length) return null;

                const attempt = attempts[0];

                if (
                    attempt.status !== "Reminded" ||
                    !attempt.reminded_at ||
                    Number(attempt.delivery_boy_id) !==
                        Number(candidate.delivery_boy_id)
                ) {
                    return null;
                }

                const latest = await query(
                    connection,
                    `
                        SELECT id
                        FROM delivery_assignment_attempts
                        WHERE order_id = ?
                        ORDER BY attempt_no DESC, id DESC
                        LIMIT 1
                    `,
                    [candidate.order_id]
                );

                if (
                    !latest.length ||
                    Number(latest[0].id) !== Number(candidate.attempt_id)
                ) {
                    return null;
                }

                const orders = await query(
                    connection,
                    `
                        SELECT id, order_type, order_status
                        FROM orders
                        WHERE id = ?
                        FOR UPDATE
                    `,
                    [candidate.order_id]
                );

                if (!isActiveOrder(orders[0])) return null;

                const elapsed = await query(
                    connection,
                    `
                        SELECT reminded_at <= DATE_SUB(
                            UTC_TIMESTAMP(),
                            INTERVAL ? MINUTE
                        ) AS ready
                        FROM delivery_assignment_attempts
                        WHERE id = ?
                    `,
                    [ESCALATION_MINUTES, candidate.attempt_id]
                );

                if (!elapsed[0] || !elapsed[0].ready) return null;

                // Find and lock the next eligible Delivery Boy.
                const nextBoys = await query(
                    connection,
                    `
                        SELECT
                            s.id
                        FROM staff s
                        WHERE s.role = 'DeliveryBoy'
                          AND s.status = 'Active'
                          AND s.online_status = 'Online'
                          AND s.on_leave = 0
                          AND TIME(
                              DATE_ADD(
                                  UTC_TIMESTAMP(),
                                  INTERVAL ? MINUTE
                              )
                          ) BETWEEN s.work_start_time AND s.work_end_time
                          AND s.id <> ?
                          AND NOT EXISTS (
                              SELECT 1
                              FROM delivery_assignments da2
                              WHERE da2.delivery_boy_id = s.id
                                AND da2.status IN (
                                    'Assigned',
                                    'Accepted',
                                    'OutForDelivery'
                                )
                          )
                        ORDER BY s.id ASC
                        LIMIT 1
                        FOR UPDATE
                    `,
                    [IST_OFFSET_MINUTES, candidate.delivery_boy_id]
                );

                // Expire the old attempt.
                const expired = await query(
                    connection,
                    `
                        UPDATE delivery_assignment_attempts
                        SET status = 'Expired',
                            expired_at = UTC_TIMESTAMP()
                        WHERE id = ?
                          AND status = 'Reminded'
                    `,
                    [candidate.attempt_id]
                );

                if (expired.affectedRows !== 1) return null;

                // No available Boy: cancel assignment.
                if (!nextBoys.length) {
                    const cancelled = await query(
                        connection,
                        `
                            UPDATE delivery_assignments
                            SET status = 'Cancelled'
                            WHERE id = ?
                              AND status = 'Assigned'
                              AND delivery_boy_id = ?
                        `,
                        [
                            candidate.assignment_id,
                            candidate.delivery_boy_id
                        ]
                    );

                    if (cancelled.affectedRows !== 1) {
                        throw new Error(
                            "Assignment changed while cancelling"
                        );
                    }

                    return {
                        type: "no_boy",
                        oldBoyId: candidate.delivery_boy_id,
                        assignmentId: candidate.assignment_id,
                        attemptNo: candidate.attempt_no
                    };
                }

                const nextBoyId = nextBoys[0].id;
                const newAttemptNo = Number(attempt.attempt_no) + 1;

                const updated = await query(
                    connection,
                    `
                        UPDATE delivery_assignments
                        SET delivery_boy_id = ?,
                            status = 'Assigned',
                            assigned_at = UTC_TIMESTAMP(),
                            accepted_at = NULL
                        WHERE id = ?
                          AND status = 'Assigned'
                          AND delivery_boy_id = ?
                    `,
                    [
                        nextBoyId,
                        candidate.assignment_id,
                        candidate.delivery_boy_id
                    ]
                );

                if (updated.affectedRows !== 1) {
                    throw new Error(
                        "Assignment changed during reassignment"
                    );
                }

                const inserted = await query(
                    connection,
                    `
                        INSERT INTO delivery_assignment_attempts
                        (
                            order_id,
                            delivery_boy_id,
                            attempt_no,
                            assigned_at,
                            status
                        )
                        VALUES (?, ?, ?, UTC_TIMESTAMP(), 'Assigned')
                    `,
                    [
                        candidate.order_id,
                        nextBoyId,
                        newAttemptNo
                    ]
                );

                return {
                    type: "reassigned",
                    oldBoyId: candidate.delivery_boy_id,
                    newBoyId: nextBoyId,
                    assignmentId: candidate.assignment_id,
                    attemptNo: newAttemptNo,
                    newAttemptId: inserted.insertId
                };
            });
        } catch (err) {
            console.error(
                "❌ ESCALATION TRANSACTION ERROR:",
                candidate.order_id,
                err
            );

            continue;
        }

        if (!result) continue;

        if (result.type === "no_boy") {
            console.log(
                "⏳ NO NEXT DELIVERY BOY — ASSIGNMENT CANCELLED:",
                candidate.order_id
            );

            try {
                await sendPushToDeliveryBoy(result.oldBoyId, {
                    orderId: candidate.order_id,
                    assignmentId: result.assignmentId,
                    attemptNo: result.attemptNo,
                    title: "❌ Delivery Assignment Expired",
                    body: `Order #${candidate.order_id} is no longer assigned to you.`,
                    tag: `delivery-rejected-${candidate.order_id}-attempt-${result.attemptNo}`,
                    url: "/staff-dashboard"
                });
            } catch (err) {
                console.error("❌ EXPIRY PUSH ERROR:", err);
            }

            continue;
        }

        console.log(
            "✅ ORDER REASSIGNED:",
            candidate.order_id,
            "NEW BOY:",
            result.newBoyId,
            "ATTEMPT:",
            result.attemptNo
        );

        // Notifications are sent only after the transaction commits.
        try {
            await sendPushToDeliveryBoy(result.oldBoyId, {
                orderId: candidate.order_id,
                assignmentId: result.assignmentId,
                attemptNo: candidate.attempt_no,
                title: "❌ Delivery Assignment Expired",
                body: `Order #${candidate.order_id} is no longer assigned to you.`,
                tag: `delivery-rejected-${candidate.order_id}-attempt-${candidate.attempt_no}`,
                url: "/staff-dashboard"
            });
        } catch (err) {
            console.error("❌ OLD DELIVERY BOY PUSH ERROR:", err);
        }
        let pushResult = null;
        let pushRetryCount = 0;
        const maxPushAttempts = 2;

        while (pushRetryCount < maxPushAttempts) {
            try {
                pushResult = await sendPushToDeliveryBoy(
                    result.newBoyId,
                    {
                        orderId: candidate.order_id,
                        assignmentId: result.assignmentId,
                        attemptNo: result.attemptNo,
                        title: "🚚 New Delivery Order",
                        body: `Order #${candidate.order_id} has been assigned to you.`,
                        tag: `delivery-order-${candidate.order_id}-attempt-${result.attemptNo}`,
                        url: "/staff-dashboard"
                    }
                );

                if (pushResult?.success === true) {
                    console.log("NEW DELIVERY BOY PUSH SUCCESS:", pushResult);
                    break;
                }

                if (!pushResult?.subscriptionsFound) {
                    console.error("PUSH RETRY SKIPPED — NO SUBSCRIPTION");
                    break;
                }

                throw new Error("All delivery push notifications failed");

            } catch (err) {
                pushRetryCount++;

                console.error(
                    "NEW DELIVERY BOY PUSH ATTEMPT FAILED:",
                    pushRetryCount,
                    err
                );

                if (pushRetryCount < maxPushAttempts) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
        }

    }
};

// ======================================================
// MAIN ESCALATION CHECK
// ======================================================

exports.checkDeliveryAssignmentEscalation = async () => {
    console.log("");
    console.log("================================================");
    console.log("🚚 DELIVERY ESCALATION CHECK");
    console.log("================================================");

    await processReminders();
    await processEscalations();
};
