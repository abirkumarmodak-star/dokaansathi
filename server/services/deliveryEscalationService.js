const db = require("../config/db");

const {
    sendPushToDeliveryBoy
} = require("./deliveryPushService");


// ======================================================
// 🚚 DELIVERY ESCALATION MONITOR
// 1) 10 min -> Reminder
// 2) Another 10 min -> Next DeliveryBoy
// ======================================================


const queryDB = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.query(sql, params, (err, result) => {
            if (err) {
                return reject(err);
            }

            resolve(result);
        });
    });
};


// ======================================================
// 🚨 STEP 1
// 10 MINUTE REMINDER TO SAME DELIVERY BOY
// ======================================================

const processReminders = async () => {

    const sql = `

        SELECT

            aa.id AS attempt_id,
            aa.order_id,
            aa.delivery_boy_id,
            aa.attempt_no,
            aa.status AS attempt_status,
            aa.assigned_at,
            aa.reminded_at,

            DATE_ADD(
                aa.assigned_at,
                INTERVAL 330 MINUTE
            ) AS assigned_at_ist,

            DATE_ADD(
                UTC_TIMESTAMP(),
                INTERVAL 330 MINUTE
            ) AS current_ist,

            TIMESTAMPDIFF(
                MINUTE,
                aa.assigned_at,
                UTC_TIMESTAMP()
            ) AS elapsed_minutes,

            da.id AS assignment_id,
            da.status AS assignment_status

        FROM delivery_assignment_attempts aa

        INNER JOIN delivery_assignments da
            ON da.order_id = aa.order_id

        INNER JOIN orders o
            ON o.id = aa.order_id

        WHERE aa.status = 'Assigned'

        AND aa.reminded_at IS NULL

        AND da.status = 'Assigned'

        AND o.order_type = 'Delivery'

        AND o.order_status NOT IN (
            'Completed',
            'Cancelled'
        )

        AND aa.assigned_at <= DATE_SUB(
            UTC_TIMESTAMP(),
            INTERVAL 10 MINUTE
        )

        AND NOT EXISTS (
            SELECT 1
            FROM delivery_assignment_attempts newer
            WHERE newer.order_id = aa.order_id
            AND newer.attempt_no > aa.attempt_no
        )

        ORDER BY aa.assigned_at ASC

    `;


    let rows;

    try {

        rows = await queryDB(sql);

    }
    catch (err) {

        console.error(
            "❌ DELIVERY REMINDER QUERY ERROR:",
            err
        );

        return;
    }


    console.log(
        "🔍 REMINDER CANDIDATES =",
        rows.length
    );


    if (!rows.length) {

        console.log(
            "✅ NO DELIVERY REMINDER REQUIRED"
        );

        return;
    }


    for (const assignment of rows) {

        console.log("");
        console.log("🚨 10-MINUTE REMINDER");
        console.log(
            "🆔 ATTEMPT ID =",
            assignment.attempt_id
        );
        console.log(
            "📦 ORDER ID =",
            assignment.order_id
        );
        console.log(
            "👤 DELIVERYBOY ID =",
            assignment.delivery_boy_id
        );
        console.log(
            "🔢 ATTEMPT NO =",
            assignment.attempt_no
        );
        console.log(
            "🇮🇳 ASSIGNED AT IST =",
            assignment.assigned_at_ist
        );
        console.log(
            "🇮🇳 CURRENT IST =",
            assignment.current_ist
        );
        console.log(
            "⏱️ ELAPSED MINUTES =",
            assignment.elapsed_minutes
        );


        // ==================================================
        // CLAIM REMINDER
        // ==================================================

        let claimResult;

        try {

            claimResult = await queryDB(

                `
                    UPDATE delivery_assignment_attempts

                    SET
                        status = 'Reminded',
                        reminded_at = UTC_TIMESTAMP()

                    WHERE id = ?

                    AND status = 'Assigned'

                    AND reminded_at IS NULL
                `,

                [
                    assignment.attempt_id
                ]

            );

        }
        catch (err) {

            console.error(
                "❌ REMINDER CLAIM ERROR:",
                err
            );

            continue;
        }


        if (
            claimResult.affectedRows === 0
        ) {

            console.log(
                "ℹ️ REMINDER ALREADY CLAIMED"
            );

            continue;
        }


        console.log(
            "✅ REMINDER CLAIMED"
        );


        // ==================================================
        // SEND REMINDER PUSH
        // ==================================================

        try {

            const pushResult =
                await sendPushToDeliveryBoy(

                    assignment.delivery_boy_id,

                    {

                        orderId:
                            assignment.order_id,

                        assignmentId:
                            assignment.assignment_id,

                        attemptNo:
                            assignment.attempt_no,

                        title:
                            "🚚 Delivery Reminder",

                        body:
                            `Order #${assignment.order_id} is still waiting for your acceptance.`,

                        tag:
                            `delivery-reminder-${assignment.order_id}-attempt-${assignment.attempt_no}`,

                        url:
                            "/staff-dashboard"

                    }

                );


            console.log(
                "📨 REMINDER PUSH RESULT =",
                pushResult
            );


            // ==================================================
            // PUSH WAS NOT ACTUALLY SENT
            // RESET FOR RETRY
            // ==================================================

            if (
                !pushResult ||
                !pushResult.success
            ) {

                await queryDB(

                    `
                        UPDATE delivery_assignment_attempts

                        SET
                            status = 'Assigned',
                            reminded_at = NULL

                        WHERE id = ?

                        AND status = 'Reminded'
                    `,

                    [
                        assignment.attempt_id
                    ]

                );


                console.log(
                    "🔄 REMINDER RESET FOR RETRY"
                );

            }

        }
        catch (pushError) {

            console.error(
                "❌ REMINDER PUSH ERROR:",
                pushError
            );


            try {

                await queryDB(

                    `
                        UPDATE delivery_assignment_attempts

                        SET
                            status = 'Assigned',
                            reminded_at = NULL

                        WHERE id = ?

                        AND status = 'Reminded'
                    `,

                    [
                        assignment.attempt_id
                    ]

                );

                console.log(
                    "🔄 REMINDER RESET AFTER PUSH ERROR"
                );

            }
            catch (resetError) {

                console.error(
                    "❌ REMINDER RESET ERROR:",
                    resetError
                );

            }

        }

    }

};


// ======================================================
// 🚨 STEP 2
// AFTER REMINDER + 10 MIN
// EXPIRE OLD BOY
// FIND NEXT AVAILABLE BOY
// ======================================================

const processEscalations = async () => {

    const sql = `

        SELECT

            aa.id AS attempt_id,
            aa.order_id,
            aa.delivery_boy_id,
            aa.attempt_no,
            aa.reminded_at,

            da.id AS assignment_id,
            da.status AS assignment_status

        FROM delivery_assignment_attempts aa

        INNER JOIN delivery_assignments da
            ON da.order_id = aa.order_id

        INNER JOIN orders o
            ON o.id = aa.order_id

        WHERE aa.status = 'Reminded'

        AND aa.reminded_at IS NOT NULL

        AND da.status = 'Assigned'

        AND o.order_type = 'Delivery'

        AND o.order_status NOT IN (
            'Completed',
            'Cancelled'
        )

        AND aa.reminded_at <= DATE_SUB(
            UTC_TIMESTAMP(),
            INTERVAL 10 MINUTE
        )

        AND NOT EXISTS (
            SELECT 1
            FROM delivery_assignment_attempts newer
            WHERE newer.order_id = aa.order_id
            AND newer.attempt_no > aa.attempt_no
        )

        ORDER BY aa.reminded_at ASC

    `;


    let rows;

    try {

        rows = await queryDB(sql);

    }
    catch (err) {

        console.error(
            "❌ DELIVERY ESCALATION QUERY ERROR:",
            err
        );

        return;
    }


    console.log(
        "🔍 ESCALATION CANDIDATES =",
        rows.length
    );


    if (!rows.length) {

        console.log(
            "✅ NO DELIVERY ESCALATION REQUIRED"
        );

        return;
    }


    for (const assignment of rows) {

        console.log("");
        console.log(
            "🚨 DELIVERY ESCALATION STARTED"
        );

        console.log(
            "📦 ORDER ID =",
            assignment.order_id
        );

        console.log(
            "👤 OLD DELIVERYBOY ID =",
            assignment.delivery_boy_id
        );

        console.log(
            "🔢 OLD ATTEMPT NO =",
            assignment.attempt_no
        );


        // ==================================================
        // FIND NEXT AVAILABLE DELIVERY BOY
        // ==================================================

        let nextBoyRows;

        try {

            nextBoyRows = await queryDB(

                `
                    SELECT
                        s.id,
                        s.status,
                        s.online_status,
                        s.on_leave,
                        s.work_start_time,
                        s.work_end_time

                    FROM staff s

                    WHERE s.role = 'DeliveryBoy'

                    AND s.status = 'Active'

                    AND s.online_status = 'Online'

                    AND s.on_leave = 0

                    AND TIME(
                        DATE_ADD(
                            UTC_TIMESTAMP(),
                            INTERVAL 330 MINUTE
                        )
                    )
                    BETWEEN
                        s.work_start_time
                    AND
                        s.work_end_time

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

                    AND NOT EXISTS (
                        SELECT 1
                        FROM delivery_assignment_attempts aa2

                        WHERE aa2.order_id = ?

                        AND aa2.delivery_boy_id = s.id
                    )

                    ORDER BY s.id ASC

                    LIMIT 1
                `,

                [
                    assignment.order_id
                ]

            );

        }
        catch (err) {

            console.error(
                "❌ NEXT DELIVERY BOY QUERY ERROR:",
                err
            );

            continue;
        }


        // ==================================================
        // NO NEXT BOY
        // ==================================================

        if (!nextBoyRows.length) {

            console.log(
                "⏳ NO NEXT DELIVERY BOY AVAILABLE RIGHT NOW"
            );

            console.log(
                "📌 CURRENT ASSIGNMENT REMAINS WITH OLD DELIVERY BOY"
            );

            continue;
        }


        const nextBoy =
            nextBoyRows[0];


        console.log(
            "✅ NEXT DELIVERY BOY FOUND =",
            nextBoy.id
        );


        // ==================================================
        // EXPIRE OLD ATTEMPT
        // ==================================================

        let expireResult;

        try {

            expireResult = await queryDB(

                `
                    UPDATE delivery_assignment_attempts

                    SET
                        status = 'Expired',
                        expired_at = UTC_TIMESTAMP()

                    WHERE id = ?

                    AND status = 'Reminded'

                    AND reminded_at IS NOT NULL

                    AND reminded_at <= DATE_SUB(
                        UTC_TIMESTAMP(),
                        INTERVAL 10 MINUTE
                    )
                `,

                [
                    assignment.attempt_id
                ]

            );

        }
        catch (err) {

            console.error(
                "❌ OLD ATTEMPT EXPIRE ERROR:",
                err
            );

            continue;
        }


        if (
            expireResult.affectedRows === 0
        ) {

            console.log(
                "ℹ️ ESCALATION ALREADY PROCESSED"
            );

            continue;
        }



        // ==================================================
        // UPDATE SAME DELIVERY ASSIGNMENT ROW
        // ==================================================

        let assignmentUpdate;

        try {

            assignmentUpdate = await queryDB(

                `
                    UPDATE delivery_assignments

                    SET
                        delivery_boy_id = ?,
                        status = 'Assigned',
                        assigned_at = UTC_TIMESTAMP(),
                        accepted_at = NULL

                    WHERE id = ?

                    AND order_id = ?

                    AND delivery_boy_id = ?

                    AND status = 'Assigned'
                `,

                [

                    nextBoy.id,

                    assignment.assignment_id,

                    assignment.order_id,

                    assignment.delivery_boy_id

                ]

            );

        }
        catch (err) {

            console.error(
                "❌ ASSIGNMENT UPDATE ERROR:",
                err
            );

            // restore old attempt if assignment update failed
            try {

                await queryDB(

                    `
                        UPDATE delivery_assignment_attempts

                        SET
                            status = 'Reminded',
                            expired_at = NULL

                        WHERE id = ?

                        AND status = 'Expired'
                    `,

                    [
                        assignment.attempt_id
                    ]

                );

            }
            catch (restoreError) {

                console.error(
                    "❌ ATTEMPT RESTORE ERROR:",
                    restoreError
                );

            }

            continue;
        }


        if (
            assignmentUpdate.affectedRows === 0
        ) {

            console.log(
                "⚠️ ASSIGNMENT NO LONGER ASSIGNED TO OLD DELIVERY BOY"
            );

            continue;
        }


        console.log(
            "✅ SAME ASSIGNMENT ROW UPDATED"
        );

        console.log(
            "🆔 ASSIGNMENT ID =",
            assignment.assignment_id
        );

        console.log(
            "👤 NEW DELIVERYBOY ID =",
            nextBoy.id
        );


        // ==================================================
        // CREATE NEW ATTEMPT
        // ==================================================

        const newAttemptNo =
            Number(assignment.attempt_no) + 1;


        let newAttemptResult;

        try {

            newAttemptResult = await queryDB(

                `
                    INSERT INTO delivery_assignment_attempts
                    (
                        order_id,
                        delivery_boy_id,
                        attempt_no,
                        assigned_at,
                        status
                    )

                    VALUES (
                        ?,
                        ?,
                        ?,
                        UTC_TIMESTAMP(),
                        'Assigned'
                    )
                `,

                [

                    assignment.order_id,

                    nextBoy.id,

                    newAttemptNo

                ]

            );

        }
        catch (err) {

            console.error(
                "❌ NEW ATTEMPT INSERT ERROR:",
                err
            );

            continue;
        }


        console.log(
            "✅ NEW DELIVERY ATTEMPT CREATED"
        );

        console.log(
            "🆔 NEW ATTEMPT ID =",
            newAttemptResult.insertId
        );

        console.log(
            "🔢 NEW ATTEMPT NO =",
            newAttemptNo
        );
// ==================================================
// 🔔 NOTIFY OLD DELIVERY BOY ABOUT REJECTION
// ==================================================

try {

    const rejectionPushResult =
        await sendPushToDeliveryBoy(

            assignment.delivery_boy_id,

            {
                orderId:
                    assignment.order_id,

                assignmentId:
                    assignment.assignment_id,

                attemptNo:
                    assignment.attempt_no,

                title:
                    "❌ Delivery Assignment Rejected",

                body:
                    `Order #${assignment.order_id} has been rejected from you because you did not accept it within the allowed time.`,

                tag:
                    `delivery-rejected-${assignment.order_id}-attempt-${assignment.attempt_no}`,

                url:
                    "/staff-dashboard"

            }

        );

    console.log(
        "📨 OLD DELIVERY BOY REJECTION PUSH =",
        rejectionPushResult
    );

}
catch (rejectionError) {

    console.error(
        "❌ OLD DELIVERY BOY REJECTION PUSH ERROR:",
        rejectionError
    );

}

        // ==================================================
        // SEND IMMEDIATE PUSH TO NEXT BOY
        // ==================================================

        try {

            const pushResult =
                await sendPushToDeliveryBoy(

                    nextBoy.id,

                    {

                        orderId:
                            assignment.order_id,

                        assignmentId:
                            assignment.assignment_id,

                        attemptNo:
                            newAttemptNo,

                        title:
                            "🚚 New Delivery Order",

                        body:
                            `Order #${assignment.order_id} has been assigned to you.`,

                        tag:
                            `delivery-order-${assignment.order_id}-attempt-${newAttemptNo}`,

                        url:
                            "/staff-dashboard"

                    }

                );


            console.log(
                "📨 NEXT DELIVERY BOY PUSH RESULT =",
                pushResult
            );

        }
        catch (pushError) {

            console.error(
                "❌ NEXT DELIVERY BOY PUSH ERROR:",
                pushError
            );

        }

    }

};


// ======================================================
// 🚀 MAIN ESCALATION CHECK
// ======================================================

exports.checkDeliveryAssignmentEscalation = async () => {

    console.log("");
    console.log("================================================");
    console.log("🚚 DELIVERY ESCALATION CHECK");
    console.log("================================================");

    try {

        await processReminders();

        await processEscalations();

    }
    catch (err) {

        console.error(
            "❌ DELIVERY ESCALATION SERVICE ERROR:",
            err
        );

    }

};