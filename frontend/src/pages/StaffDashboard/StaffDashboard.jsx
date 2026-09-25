import { useEffect, useState, useRef } from "react";
import axios from "axios";
import "./StaffDashboard.css";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";

// ======================================================
// BACKEND API
// ======================================================

const API_URL = "https://dokaansathi.onrender.com/api";

const urlBase64ToUint8Array = (base64String) => {

    const padding =
        "=".repeat(
            (4 - base64String.length % 4) % 4
        );

    const base64 =
        (
            base64String +
            padding
        )
            .replace(/-/g, "+")
            .replace(/_/g, "/");

    const rawData =
        window.atob(base64);

    return Uint8Array.from(
        [...rawData].map(
            char => char.charCodeAt(0)
        )
    );
};

function StaffDashboard() {

    // ======================================================
    // STATE
    // ======================================================

    const [orders, setOrders] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [staff, setStaff] = useState(null);

    const [showOwnerQrScanner, setShowOwnerQrScanner] =
        useState(null);

    const navigate = useNavigate();

    // ======================================================
    // NOTIFICATION STATE
    // ======================================================

    const [notificationEnabled, setNotificationEnabled] =
        useState(
            "Notification" in window &&
            Notification.permission === "granted"
        );
const [managerDeliveryAlert, setManagerDeliveryAlert] =
    useState(null);
    // ======================================================
    // ORDER / ASSIGNMENT TRACKING
    // ======================================================

    const previousPendingIds =
        useRef(new Set());

    const previousAssignmentIds =
        useRef(new Set());

    const previousAssignmentStatuses =
        useRef(new Map());

    const previousOrderStatuses =
        useRef(new Map());

    const firstCancellationLoad =
        useRef(true);

    const notifiedCancelledAssignmentIds =
        useRef(new Set());

    const firstOrderLoad =
        useRef(true);

    const firstAssignmentLoad =
        useRef(true);

    // DeliveryBoy / Staff assignment tracking
    const previousStaffAssignmentIds =
        useRef(new Set());

    const firstStaffAssignmentLoad =
        useRef(true);

    // Manager delivery-order tracking
    const previousManagerAssignmentIds =
        useRef(new Set());

    const firstManagerAssignmentLoad =
        useRef(true);
    
    // ======================================================
    // NOTIFICATION AUDIO
    // ======================================================

    const notificationAudio =
        useRef(null);

    const alertAudioContext =
        useRef(null);

    useEffect(() => {

        notificationAudio.current =
            new Audio("/notification.mp3");

        notificationAudio.current.preload =
            "auto";

    }, []);

    // ======================================================
    // HIGH-PRIORITY DELIVERY ALERT SOUND
    // ======================================================

    const playNotificationSound = async () => {

        try {

            const AudioContext =
                window.AudioContext ||
                window.webkitAudioContext;

            if (!AudioContext) {

                console.log(
                    "❌ Web Audio API not supported"
                );

                return;
            }

            // ==========================================
            // CREATE / REUSE AUDIO CONTEXT
            // ==========================================

            if (!alertAudioContext.current) {

                alertAudioContext.current =
                    new AudioContext();

            }

            const context =
                alertAudioContext.current;

            // ==========================================
            // RESUME AUDIO
            // ==========================================

            if (
                context.state ===
                "suspended"
            ) {

                await context.resume();

            }

            // ==========================================
            // MASTER COMPRESSOR
            // ==========================================

            const compressor =
                context.createDynamicsCompressor();

            compressor.threshold.value =
                -24;

            compressor.knee.value =
                12;

            compressor.ratio.value =
                8;

            compressor.attack.value =
                0.003;

            compressor.release.value =
                0.15;

            compressor.connect(
                context.destination
            );

            const now =
                context.currentTime;

            // ==========================================
            // ALERT PATTERN
            // ==========================================

            const tones = [

                {
                    frequency: 700,
                    start: 0.00,
                    duration: 0.28
                },

                {
                    frequency: 1100,
                    start: 0.34,
                    duration: 0.28
                },

                {
                    frequency: 700,
                    start: 0.68,
                    duration: 0.28
                },

                {
                    frequency: 1100,
                    start: 1.02,
                    duration: 0.28
                },

                {
                    frequency: 700,
                    start: 1.36,
                    duration: 0.28
                },

                {
                    frequency: 1100,
                    start: 1.70,
                    duration: 0.28
                }

            ];

            tones.forEach(
                tone => {

                    const oscillator =
                        context.createOscillator();

                    const gain =
                        context.createGain();

                    oscillator.type =
                        "square";

                    oscillator.frequency.setValueAtTime(
                        tone.frequency,
                        now + tone.start
                    );

                    // ==================================
                    // SHARP ATTACK
                    // ==================================

                    gain.gain.setValueAtTime(
                        0.0001,
                        now + tone.start
                    );

                    gain.gain.exponentialRampToValueAtTime(
                        0.8,
                        now +
                            tone.start +
                            0.015
                    );

                    // ==================================
                    // CLEAN RELEASE
                    // ==================================

                    gain.gain.exponentialRampToValueAtTime(
                        0.0001,
                        now +
                            tone.start +
                            tone.duration
                    );

                    oscillator.connect(
                        gain
                    );

                    gain.connect(
                        compressor
                    );

                    oscillator.start(
                        now + tone.start
                    );

                    oscillator.stop(
                        now +
                            tone.start +
                            tone.duration
                    );

                }
            );

            console.log(
                "🚨 HIGH-PRIORITY DELIVERY ALERT PLAYED"
            );

        }

        catch (error) {

            console.log(
                "❌ DELIVERY ALERT SOUND ERROR:",
                error
            );

        }

    };
        // ======================================================
    // LOAD STAFF ACCOUNT
    // ======================================================

    useEffect(() => {

        try {

            const savedStaffUser =
                localStorage.getItem("staffUser");

            const savedStaff =
                localStorage.getItem("staff");

            const staffData =
                savedStaffUser || savedStaff;

            if (staffData) {

                const parsedStaff =
                    JSON.parse(staffData);

                console.log(
                    "STAFF USER LOADED =",
                    parsedStaff
                );

                console.log(
                    "STAFF ROLE =",
                    parsedStaff?.role
                );

                console.log(
                    "ON LEAVE VALUE =",
                    parsedStaff?.on_leave,
                    "TYPE =",
                    typeof parsedStaff?.on_leave
                );

                setStaff(parsedStaff);

            }

        }

        catch (err) {

            console.log(
                "Staff data error:",
                err
            );

        }

    }, []);

    // ======================================================
    // OWNER QR SCANNER
    // ======================================================

    useEffect(() => {

        if (!showOwnerQrScanner) {
            return;
        }

        const readerId =
            `owner-qr-reader-${showOwnerQrScanner}`;

        let scanner = null;

        const startScanner = async () => {

            try {

                scanner =
                    new Html5Qrcode(
                        readerId
                    );

               await scanner.start(
    {
        facingMode: "environment"
    },
                    {
                        fps: 10,
                        qrbox: {
                            width: 250,
                            height: 250
                        }
                    },
                    async (decodedText) => {

                        console.log(
                            "✅ OWNER QR SCANNED =",
                            decodedText
                        );

                        alert(
                            `✅ QR Scanned!\n\n${decodedText}`
                        );

                        try {

                            await scanner.stop();

                        }

                        catch (stopError) {

                            console.log(
                                "Scanner stop error:",
                                stopError
                            );

                        }

                        try {

                            await scanner.clear();

                        }

                        catch (clearError) {

                            console.log(
                                "Scanner clear error:",
                                clearError
                            );

                        }

                        setShowOwnerQrScanner(
                            null
                        );

                    },
                    () => {

                        // QR না পাওয়া গেলে
                        // কোনো console message নয়

                    }
                );

                console.log(
                    "📷 OWNER QR CAMERA STARTED"
                );

            }

            catch (error) {

                console.error(
                    "❌ OWNER QR CAMERA ERROR =",
                    error
                );

                alert(
                    "❌ Camera চালু করা যাচ্ছে না। Camera permission check করুন."
                );

                setShowOwnerQrScanner(
                    null
                );

            }

        };

        const timer =
            setTimeout(
                startScanner,
                300
            );

        return () => {

            clearTimeout(timer);

            if (scanner) {

                scanner
                    .stop()
                    .catch(() => {})
                    .finally(() => {

                        scanner
                            .clear()
                            .catch(() => {});

                    });

            }

        };

    }, [showOwnerQrScanner]);

    // ======================================================
    // ENABLE NOTIFICATIONS
    // ======================================================

    const enableNotifications = async () => {

        console.log(
            "🔔 ENABLE NOTIFICATIONS STARTED"
        );

        console.log(
            "🌐 Notification supported =",
            "Notification" in window
        );

        console.log(
            "🔐 Current permission =",
            "Notification" in window
                ? Notification.permission
                : "unsupported"
        );

        if (!("Notification" in window)) {

            alert(
                "This browser does not support notifications."
            );

            return;
        }

        try {

            const permission =
                await Notification.requestPermission();

            if (permission === "granted") {

                // ==========================================
                // 🔊 UNLOCK AUDIO
                // ==========================================

                const AudioContext =
                    window.AudioContext ||
                    window.webkitAudioContext;

                if (
                    AudioContext &&
                    !alertAudioContext.current
                ) {

                    alertAudioContext.current =
                        new AudioContext();

                }

                if (
                    alertAudioContext.current &&
                    alertAudioContext.current.state ===
                        "suspended"
                ) {

                    await alertAudioContext.current.resume();

                }

                setNotificationEnabled(
                    true
                );

                // ==========================================
                // PUSH SUBSCRIPTION
                // ==========================================

                await subscribeToPushNotifications();

                // ==========================================
                // PRELOAD / UNLOCK AUDIO FILE
                // ==========================================

                if (notificationAudio.current) {

                    notificationAudio.current.load();

                    notificationAudio.current
                        .play()
                        .then(() => {

                            console.log(
                                "🔊 Notification sound unlocked"
                            );

                            notificationAudio.current.pause();

                            notificationAudio.current.currentTime =
                                0;

                        })
                        .catch((err) => {

                            console.log(
                                "🔇 Audio unlock failed:",
                                err
                            );

                        });

                }

                // ==========================================
                // TEST NOTIFICATION
                // ==========================================

                const notification =
                    new Notification(
                        "🔔 Dokaansathi Notifications Enabled",
                        {
                            body:
                                "You will receive new order alerts here.",
                            icon: "/favicon.svg"
                        }
                    );

                setTimeout(() => {

                    notification.close();

                }, 5000);

            }

            else {

                alert(
                    "Notification permission was not granted."
                );

            }

        }

        catch (error) {

            console.log(
                "Notification permission error:",
                error
            );

        }

    };

    // ======================================================
    // PUSH SUBSCRIPTION
    // ======================================================

    const subscribeToPushNotifications =
        async () => {

            try {

                if (
                    !("serviceWorker" in navigator) ||
                    !("PushManager" in window) ||
                    !("Notification" in window)
                ) {

                    console.log(
                        "❌ This browser does not support Web Push"
                    );

                    return;
                }

                // ======================================
                // REGISTER SERVICE WORKER
                // ======================================

                const registration =
                    await navigator.serviceWorker.register(
                        "/service-worker.js"
                    );

                console.log(
                    "🔑 VAPID PUBLIC KEY =",
                    import.meta.env
                        .VITE_VAPID_PUBLIC_KEY
                );

                console.log(
                    "🔑 ALL VITE ENV =",
                    import.meta.env
                );

                console.log(
                    "🔔 Push Service Worker Registered"
                );

                // ======================================
                // NOTIFICATION PERMISSION
                // ======================================

                let permission =
                    Notification.permission;

                if (
                    permission !==
                    "granted"
                ) {

                    permission =
                        await Notification.requestPermission();

                }

                if (
                    permission !==
                    "granted"
                ) {

                    console.log(
                        "🔕 Notification permission not granted"
                    );

                    return;
                }

                // ======================================
                // GET EXISTING SUBSCRIPTION
                // ======================================

                let subscription =
                    await registration
                        .pushManager
                        .getSubscription();

                // ======================================
                // CREATE NEW SUBSCRIPTION
                // ======================================

                if (!subscription) {

                    subscription =
                        await registration
                            .pushManager
                            .subscribe(
                                {
                                    userVisibleOnly:
                                        true,

                                    applicationServerKey:
                                        urlBase64ToUint8Array(
                                            import.meta.env
                                                .VITE_VAPID_PUBLIC_KEY
                                        )
                                }
                            );

                }

                console.log(
                    "🔔 PUSH SUBSCRIPTION CREATED"
                );

                // ======================================
                // CHECK STAFF
                // ======================================

                if (!staff?.id) {

                    console.log(
                        "❌ Staff ID not available for push subscription"
                    );

                    return;
                }

                // ======================================
                // SEND SUBSCRIPTION TO BACKEND
                // ======================================

                const response =
                    await fetch(
                        `${API_URL}/push/subscribe`,
                        {
                            method:
                                "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify(
                                    {
                                        staff_id:
                                            staff.id,

                                        subscription:
                                            subscription.toJSON()
                                    }
                                )
                        }
                    );

                const data =
                    await response.json();

                console.log(
                    "🔔 PUSH SUBSCRIPTION RESPONSE =",
                    data
                );

            }

            catch (error) {

                console.error(
                    "❌ PUSH SUBSCRIPTION ERROR:",
                    error
                );

            }

        };

    // ======================================================
    // NOTIFICATION BUTTON TEST
    // ======================================================
useEffect(() => {

    const handleDeliveryPush =
        (event) => {

            if (
                event.data?.type ===
                "DELIVERY_ALERT"
            ) {

                console.log(
                    "🔊 PUSH → PLAY DELIVERY SOUND",
                    event.data
                );

                playNotificationSound();

                if (
                    "vibrate" in navigator
                ) {

                    navigator.vibrate([
                        500,
                        200,
                        500,
                        200,
                        1000
                    ]);

                }

            }

        };

    if (
        "serviceWorker" in navigator
    ) {

        navigator.serviceWorker.addEventListener(
            "message",
            handleDeliveryPush
        );

    }

    return () => {

        if (
            "serviceWorker" in navigator
        ) {

            navigator.serviceWorker.removeEventListener(
                "message",
                handleDeliveryPush
            );

        }

    };

}, []);
    const handleNotificationButton =
        () => {

            console.log(
                "🔔 NOTIFICATION BUTTON CLICKED"
            );

            enableNotifications();

        };
         // ======================================================
    // NEW NORMAL ORDER NOTIFICATION
    // ======================================================

    const notifyNewOrder = (order) => {

        console.log(
            "🔔 NEW ORDER NOTIFICATION:",
            order
        );

        // ==========================================
        // SAME HIGH-PRIORITY SOUND
        // ==========================================

        playNotificationSound();

        // ==========================================
        // VIBRATION
        // ==========================================

        if ("vibrate" in navigator) {

            navigator.vibrate([
                500,
                200,
                500,
                200,
                1000
            ]);

        }

        // ==========================================
        // BROWSER NOTIFICATION
        // ==========================================

        if (
            "Notification" in window &&
            Notification.permission === "granted"
        ) {

            const notification =
                new Notification(
                    "🔔 New Order Received!",
                    {
                        body:
                            `Order #${order.id || order.order_id} has been placed.`,
                        icon: "/favicon.svg",
                        requireInteraction: true
                    }
                );

            notification.onclick = () => {

                window.focus();

                notification.close();

            };

        }

    };


    // ======================================================
    // LOAD ORDERS
    // ======================================================

    const loadOrders = async () => {

        try {

            console.log(
                "Loading Orders...",
                new Date().toLocaleTimeString()
            );

            // ==================================================
            // GET CURRENT STAFF USER
            // ==================================================

            const savedStaffUser =
                localStorage.getItem("staffUser");

            const savedStaff =
                localStorage.getItem("staff");

            const staffData =
                savedStaffUser || savedStaff;

            let currentStaff = null;

            if (staffData) {

                try {

                    currentStaff =
                        JSON.parse(staffData);

                }

                catch (parseError) {

                    console.log(
                        "STAFF USER PARSE ERROR =",
                        parseError
                    );

                }

            }


            // ==================================================
            // GET STAFF JWT
            // ==================================================

            const staffToken =
                localStorage.getItem("staffToken");

            console.log(
                "STAFF USER =",
                currentStaff
            );

            console.log(
                "STAFF ROLE =",
                currentStaff?.role
            );

            console.log(
                "STAFF TOKEN EXISTS =",
                !!staffToken
            );


            // ==================================================
            // DELIVERY BOY MODE
            // ==================================================

            if (
                currentStaff?.role ===
                "DeliveryBoy"
            ) {

                console.log(
                    "🚚 DELIVERY BOY MODE"
                );


                // ----------------------------------------------
                // TOKEN CHECK
                // ----------------------------------------------

                if (!staffToken) {

                    console.log(
                        "❌ DeliveryBoy token missing"
                    );

                    setError(
                        "DeliveryBoy login token missing. Please login again."
                    );

                    setOrders([]);

                    return;

                }


                // ----------------------------------------------
                // GET ASSIGNED ORDERS
                // ----------------------------------------------

                const res =
                    await axios.get(

                        `${API_URL}/delivery-assignments/my-orders`,

                        {
                            headers: {
                                Authorization:
                                    `Bearer ${staffToken}`
                            }
                        }

                    );


                console.log(
                    "DELIVERY MY ORDERS RESPONSE =",
                    res.data
                );


                // ----------------------------------------------
                // NORMALIZE
                // ----------------------------------------------

                const deliveryOrders =
                    Array.isArray(res.data)
                        ? res.data
                        : Array.isArray(res.data.orders)
                            ? res.data.orders
                            : [];


                console.log(
                    "🚚 DELIVERY ORDERS =",
                    deliveryOrders
                );


                // ==========================================
                // DELIVERY BOY NOTIFICATIONS
                // ==========================================

                const currentAssignments =
                    new Map(

                        deliveryOrders
                            .filter(
                                order =>
                                    order.assignment_id != null
                            )
                            .map(
                                order => [

                                    Number(
                                        order.assignment_id
                                    ),

                                    {
                                        status:
                                            String(
                                                order.delivery_status ||
                                                ""
                                            ).trim(),

                                        order_id:
                                            order.order_id

                                    }

                                ]
                            )

                    );


                // ==========================================
                // FIRST LOAD
                // ==========================================

                if (
                    firstAssignmentLoad.current
                ) {

                    previousAssignmentStatuses.current =
                        currentAssignments;


                    // Existing cancelled orders
                    // should not create notification

                    deliveryOrders
                        .filter(
                            order =>
                                order.assignment_id != null &&
                                String(
                                    order.delivery_status ||
                                    ""
                                ).trim() ===
                                    "Cancelled"
                        )
                        .forEach(
                            order => {

                                notifiedCancelledAssignmentIds.current.add(
                                    Number(
                                        order.assignment_id
                                    )
                                );

                            }
                        );


                    firstAssignmentLoad.current =
                        false;


                    console.log(
                        "📦 INITIAL DELIVERY ASSIGNMENTS LOADED =",
                        deliveryOrders
                    );

                }


                // ==========================================
                // NEXT POLLING
                // ==========================================

                else {

                    // --------------------------------------
                    // NEW DELIVERY ASSIGNMENT
                    // --------------------------------------

                    const newAssignments =
                        deliveryOrders.filter(
                            order => {

                                if (
                                    order.assignment_id ==
                                    null
                                ) {

                                    return false;

                                }


                                const assignmentId =
                                    Number(
                                        order.assignment_id
                                    );


                                const currentStatus =
                                    String(
                                        order.delivery_status ||
                                        ""
                                    ).trim();


                                const previous =
                                    previousAssignmentStatuses.current.get(
                                        assignmentId
                                    );


                                return (
                                    currentStatus ===
                                        "Assigned" &&
                                    !previous
                                );

                            }
                        );


                    // --------------------------------------
                    // SAME SOUND
                    // --------------------------------------

                    if (
                        newAssignments.length >
                        0
                    ) {

                        console.log(
                            "🚨 NEW DELIVERY ASSIGNMENT RECEIVED 🚨",
                            newAssignments
                        );


                        // SAME SOUND
                        playNotificationSound();


                        // SAME VIBRATION
                        if ("vibrate" in navigator) {

                            navigator.vibrate([
                                500,
                                200,
                                500,
                                200,
                                1000
                            ]);

                        }


                        // SAME BROWSER NOTIFICATION
                        if (
                            "Notification" in window &&
                            Notification.permission ===
                                "granted"
                        ) {

                            const assignment =
                                newAssignments[0];


                            const notification =
                                new Notification(
                                    "🚚 New Delivery Assigned",
                                    {
                                        body:
                                            `Order #${assignment.order_id} has been assigned to you.`,

                                        icon:
                                            "/favicon.svg",

                                        requireInteraction:
                                            true

                                    }
                                );


                            notification.onclick =
                                () => {

                                    window.focus();

                                    notification.close();

                                };

                        }

                    }


                    // --------------------------------------
                    // CUSTOMER CANCELLATION
                    // --------------------------------------

                    const cancelledAssignments =
                        deliveryOrders.filter(
                            order => {

                                if (
                                    order.assignment_id ==
                                    null
                                ) {

                                    return false;

                                }


                                const assignmentId =
                                    Number(
                                        order.assignment_id
                                    );


                                const currentStatus =
                                    String(
                                        order.delivery_status ||
                                        ""
                                    ).trim();


                                return (
                                    currentStatus ===
                                        "Cancelled" &&
                                    !notifiedCancelledAssignmentIds.current.has(
                                        assignmentId
                                    )
                                );

                            }
                        );


                    // --------------------------------------
                    // CANCELLATION SOUND
                    // --------------------------------------

                    if (
                        cancelledAssignments.length >
                        0
                    ) {

                        console.log(
                            "🚨🚨 DELIVERY ORDER CANCELLED 🚨🚨",
                            cancelledAssignments
                        );


                        // SAME SOUND
                        playNotificationSound();


                        // SAME VIBRATION
                        if ("vibrate" in navigator) {

                            navigator.vibrate([
                                500,
                                200,
                                500,
                                200,
                                1000
                            ]);

                        }


                        // BROWSER NOTIFICATION
                        if (
                            "Notification" in window &&
                            Notification.permission ===
                                "granted"
                        ) {

                            const cancelledOrder =
                                cancelledAssignments[0];


                            const notification =
                                new Notification(
                                    "❌ Delivery Order Cancelled",
                                    {
                                        body:
                                            `Order #${cancelledOrder.order_id} has been cancelled by the customer.`,

                                        icon:
                                            "/favicon.svg",

                                        requireInteraction:
                                            true

                                    }
                                );


                            notification.onclick =
                                () => {

                                    window.focus();

                                    notification.close();

                                };

                        }


                        // Mark as notified
                        cancelledAssignments.forEach(
                            order => {

                                notifiedCancelledAssignmentIds.current.add(
                                    Number(
                                        order.assignment_id
                                    )
                                );

                            }
                        );

                    }


                    // --------------------------------------
                    // UPDATE PREVIOUS STATUS
                    // --------------------------------------

                    previousAssignmentStatuses.current =
                        currentAssignments;

                }


                setOrders(
                    deliveryOrders
                );

                setError("");

                return;

            }


            // ==================================================
            // NORMAL STAFF / MANAGER MODE
            // ==================================================

            console.log(
                "👨‍🍳 NORMAL STAFF MODE"
            );


            const res =
                await axios.get(
                    `${API_URL}/orders`
                );


            console.log(
                "ORDERS API RESPONSE:",
                res.data
            );


            // ==================================================
            // NORMALIZE API RESPONSE
            // ==================================================

            const orderList =
                Array.isArray(res.data)

                    ? res.data

                    : Array.isArray(
                        res.data.orders
                    )

                        ? res.data.orders

                        : [];

console.table(
    orderList.slice(0, 10).map(order => ({
        id: order.id,
        order_type: order.order_type,
        order_status: order.order_status,
        created_at: order.created_at
    }))
);
            // ==================================================
            // 🚚 MANAGER NEW DELIVERY ORDER DETECTION
            // ==================================================
            // IMPORTANT:
            // This uses ORDER ID, not assignment ID.
            // Therefore Manager gets sound as soon as
            // a new Delivery order enters the dashboard.
            // ==================================================

            
                    // ------------------------------------------
                    // SAVE CURRENT DELIVERY ORDER IDS
                    // ------------------------------------------

                      // ==================================================
            // 🚚 NEW DELIVERY ORDER → MANAGER ALERT
            // ==================================================
// ==================================================
// 🚚 MANAGER NEW DELIVERY ORDER DETECTION
// ==================================================



            // ==================================================
            // NORMAL STAFF PENDING ORDERS
            // ==================================================
            // Manager Delivery orders are excluded here
            // because they already have their own sound above.
            // ==================================================




            // ==================================================
            // CUSTOMER CANCELLATION - NORMAL STAFF
            // ==================================================

            const currentOrderStatuses =
                new Map(

                    orderList.map(
                        order => [

                            Number(
                                order.id
                            ),

                            String(
                                order.order_status ||
                                ""
                            ).trim()

                        ]
                    )

                );


            // ==================================================
            // FIRST LOAD
            // ==================================================

            if (
                firstCancellationLoad.current
            ) {

                previousOrderStatuses.current =
                    currentOrderStatuses;


                firstCancellationLoad.current =
                    false;

            }


            // ==================================================
            // NEXT POLLING
            // ==================================================

            else {

                const cancelledOrders =
                    orderList.filter(
                        order => {

                            const orderId =
                                Number(
                                    order.id
                                );


                            const currentStatus =
                                String(
                                    order.order_status ||
                                    ""
                                ).trim();


                            const previousStatus =
                                previousOrderStatuses.current.get(
                                    orderId
                                );


                            return (
                                currentStatus ===
                                    "Cancelled" &&
                                previousStatus !==
                                    "Cancelled"
                            );

                        }
                    );


                // ------------------------------------------
                // CANCELLATION SOUND
                // ------------------------------------------

                if (
                    cancelledOrders.length >
                    0
                ) {

                    console.log(
                        "🚨 STAFF: CUSTOMER CANCELLED ORDER",
                        cancelledOrders
                    );


                    // SAME SOUND
                    playNotificationSound();


                    // SAME VIBRATION
                    if ("vibrate" in navigator) {

                        navigator.vibrate([
                            500,
                            200,
                            500,
                            200,
                            1000
                        ]);

                    }


                    // SAME BROWSER NOTIFICATION
                    if (
                        "Notification" in window &&
                        Notification.permission ===
                            "granted"
                    ) {

                        const cancelledOrder =
                            cancelledOrders[0];


                        const notification =
                            new Notification(
                                "❌ Order Cancelled",
                                {
                                    body:
                                        `Order #${cancelledOrder.id} has been cancelled by the customer.`,

                                    icon:
                                        "/favicon.svg",

                                    requireInteraction:
                                        true
                                }
                            );


                        notification.onclick =
                            () => {

                                window.focus();

                                notification.close();

                            };

                    }

                }


                previousOrderStatuses.current =
                    currentOrderStatuses;

            }


            // ==================================================
            // UPDATE ORDERS
            // ==================================================

            setOrders(
                orderList
            );

            setError("");

        }

        catch (err) {

            console.log(
                "STAFF ORDER ERROR:",
                err
            );


            console.log(
                "ERROR RESPONSE =",
                err.response?.data
            );


            // ==================================================
            // INVALID TOKEN
            // ==================================================

            if (
                err.response?.status ===
                401
            ) {

                console.log(
                    "❌ Authentication failed"
                );


                setError(
                    err.response.data?.message ||
                    "Invalid Token. Please login again."
                );

            }


            // ==================================================
            // ACCESS DENIED
            // ==================================================

            else if (
                err.response?.status ===
                403
            ) {

                setError(
                    err.response.data?.message ||
                    "Access denied."
                );

            }


            // ==================================================
            // OTHER BACKEND ERROR
            // ==================================================

            else if (
                err.response
            ) {

                setError(
                    err.response.data?.message ||
                    `Backend Error: ${err.response.status}`
                );

            }


            // ==================================================
            // CONNECTION ERROR
            // ==================================================

            else {

                setError(
                    "Cannot connect to backend"
                );

            }

        }


        finally {

            setLoading(
                false
            );

        }

    };
    // ======================================================
// INITIAL LOAD + AUTO REFRESH
// ======================================================

// ======================================================
// 🚚 DELIVERY BOY HEARTBEAT
// ======================================================

useEffect(() => {

    if (
        staff?.role !== "DeliveryBoy"
    ) {
        return;
    }

    console.log(
        "💚 DELIVERY BOY HEARTBEAT STARTED"
    );

    // Dashboard খুললেই প্রথম heartbeat
    sendHeartbeat();

    // তারপর প্রতি 30 seconds
    const heartbeatInterval =
        setInterval(() => {

            sendHeartbeat();

        }, 30000);

    return () => {

        clearInterval(
            heartbeatInterval
        );

        console.log(
            "💔 DELIVERY BOY HEARTBEAT STOPPED"
        );

    };

}, [staff]);


// ======================================================
// 🤖 MANAGER DASHBOARD AUTO ASSIGN ENGINE
// ======================================================

useEffect(() => {

    if (
        staff?.role !== "Manager"
    ) {
        return;
    }

    console.log(
        "🤖 MANAGER AUTO ASSIGN ENGINE STARTED"
    );

    autoAssignWaitingDelivery();

    const autoAssignInterval =
        setInterval(() => {

            autoAssignWaitingDelivery();

        }, 10000);

    return () => {

        clearInterval(
            autoAssignInterval
        );

        console.log(
            "🤖 MANAGER AUTO ASSIGN ENGINE STOPPED"
        );

    };

}, [staff]);


// ======================================================
// 📦 LOAD ORDERS EVERY 5 SECONDS
// ======================================================

useEffect(() => {

    loadOrders();

    const interval =
        setInterval(() => {

            loadOrders();

        }, 5000);

    return () => {

        clearInterval(
            interval
        );

    };

}, []);


// ======================================================
// 🤖 AUTO ASSIGN WAITING DELIVERY
// ======================================================

const autoAssignWaitingDelivery = async () => {

    try {

        const token =
            localStorage.getItem(
                "staffToken"
            );

        if (!token) {

            console.log(
                "❌ AUTO ASSIGN: STAFF TOKEN NOT FOUND"
            );

            return;

        }


        const response =
            await axios.post(

                `${API_URL}/delivery-assignments/auto-assign-waiting`,

                {},

                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }

            );


        console.log(
            "🤖 STAFF AUTO ASSIGN RESPONSE =",
            response.data
        );


        // ==========================================
        // ASSIGNMENT CREATED
        // ==========================================

        if (
            response.data?.waitingOrderAssigned
        ) {

            console.log(
                "✅ WAITING ORDER AUTO ASSIGNED =",
                response.data.assignment
            );

            // Refresh orders.
            // Manager's SAME delivery sound is handled
            // by loadOrders() when the new Delivery order
            // appears.
            loadOrders();

        }

    }

    catch (error) {

        console.error(
            "❌ STAFF AUTO ASSIGN ERROR =",
            error.response?.data ||
            error.message
        );

    }

};


// ======================================================
// ACCEPT NORMAL ORDER
// ======================================================

const acceptOrder = async (
    orderId
) => {

    try {

        await axios.post(
            `${API_URL}/orders/accept`,
            {
                order_id:
                    orderId
            }
        );


        alert(
            "Order Accepted"
        );


        loadOrders();

    }

    catch (err) {

        console.log(
            err
        );


        alert(
            err.response?.data?.message ||
            "Failed to Accept Order"
        );

    }

};


// ======================================================
// START PREPARING
// ======================================================

const startPreparing = async (
    orderId
) => {

    try {

        await axios.post(
            `${API_URL}/orders/preparing`,
            {
                order_id:
                    orderId
            }
        );


        alert(
            "Order is now Preparing"
        );


        loadOrders();

    }

    catch (err) {

        console.log(
            err
        );


        alert(
            err.response?.data?.message ||
            "Failed to start preparing"
        );

    }

};


// ======================================================
// MARK READY
// ======================================================

const markReady = async (
    orderId
) => {

    try {

        await axios.post(
            `${API_URL}/orders/ready`,
            {
                order_id:
                    orderId
            }
        );


        alert(
            "Order Ready"
        );


        loadOrders();

    }

    catch (err) {

        console.log(
            err
        );


        alert(
            err.response?.data?.message ||
            "Failed to mark order ready"
        );

    }

};


// ======================================================
// COMPLETE ORDER
// ======================================================

const completeOrder = async (
    orderId
) => {

    try {

        await axios.post(
            `${API_URL}/orders/complete`,
            {
                order_id:
                    orderId
            }
        );


        alert(
            "Order Completed"
        );


        loadOrders();

    }

    catch (err) {

        console.log(
            err
        );


        alert(
            err.response?.data?.message ||
            "Failed to complete order"
        );

    }

};


// ======================================================
// 🚚 ACCEPT DELIVERY
// ======================================================

const acceptDelivery = async (
    assignmentId
) => {

    try {

        const staffToken =
            localStorage.getItem(
                "staffToken"
            );


        const res =
            await axios.patch(

                `${API_URL}/delivery-assignments/accept/${assignmentId}`,

                {},

                {
                    headers: {
                        Authorization:
                            `Bearer ${staffToken}`
                    }
                }

            );


        console.log(
            "✅ ACCEPT DELIVERY RESPONSE =",
            res.data
        );


        console.log(
            "📏 SHOP → CUSTOMER DISTANCE =",
            res.data.distanceKm,
            "KM"
        );


        loadOrders();

    }

    catch (err) {

        console.log(
            "❌ ACCEPT DELIVERY ERROR =",
            err
        );


        alert(
            err.response?.data?.message ||
            "Failed to accept delivery"
        );

    }

};


// ======================================================
// 📦 PICKUP DELIVERY
// ======================================================

const pickupDelivery = async (
    assignmentId
) => {

    try {

        const staffToken =
            localStorage.getItem(
                "staffToken"
            );


        const res =
            await axios.patch(

                `${API_URL}/delivery-assignments/pickup/${assignmentId}`,

                {},

                {
                    headers: {
                        Authorization:
                            `Bearer ${staffToken}`
                    }
                }

            );


        console.log(
            "📦 PICKUP DELIVERY RESPONSE =",
            res.data
        );


        alert(
            "📦 Order Picked Up Successfully"
        );


        loadOrders();

    }

    catch (err) {

        console.log(
            "❌ PICKUP DELIVERY ERROR =",
            err
        );


        console.log(
            "ERROR RESPONSE =",
            err.response?.data
        );


        alert(
            err.response?.data?.message ||
            "Failed to pickup delivery"
        );

    }

};


// ======================================================
// 💚 DELIVERY BOY HEARTBEAT FUNCTION
// ======================================================

const sendHeartbeat = async () => {

    try {

        const token =
            localStorage.getItem(
                "staffToken"
            );


        if (!token) {

            console.log(
                "❌ No staff token found"
            );

            return;

        }


        const response =
            await axios.patch(

                `${API_URL}/delivery-assignments/heartbeat`,

                {},

                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }

            );


        console.log(
            "💚 HEARTBEAT SUCCESS =",
            response.data
        );

    }

    catch (error) {

        console.error(
            "❌ HEARTBEAT ERROR =",
            error.response?.data ||
            error.message
        );

    }

};


// ======================================================
// 🏖️ APPLY LEAVE / RETURN TO WORK
// ======================================================

const applyLeave = async () => {

    try {

        const token =
            localStorage.getItem(
                "staffToken"
            );


        const newLeaveStatus =
            staff?.on_leave === 1
                ? 0
                : 1;


        const response =
            await axios.patch(

                `${API_URL}/delivery-assignments/leave`,

                {
                    on_leave:
                        newLeaveStatus
                },

                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }

            );


        console.log(
            "🏖️ LEAVE RESPONSE =",
            response.data
        );


        // ==========================================
        // UPDATE REACT STATE
        // ==========================================

        setStaff(
            prev => ({
                ...prev,
                on_leave:
                    newLeaveStatus,
                online_status:
                    "Offline"
            })
        );


        // ==========================================
        // UPDATE LOCAL STORAGE
        // ==========================================

        const storedStaff =
            JSON.parse(
                localStorage.getItem(
                    "staffUser"
                ) || "{}"
            );


        localStorage.setItem(
            "staffUser",
            JSON.stringify(
                {
                    ...storedStaff,

                    on_leave:
                        newLeaveStatus,

                    online_status:
                        "Offline"
                }
            )
        );


        alert(
            newLeaveStatus === 1
                ? "🏖️ Leave applied successfully"
                : "🔙 Returned to work successfully"
        );

    }

    catch (error) {

        console.error(
            "❌ LEAVE ERROR =",
            error.response?.data ||
            error.message
        );

        alert(
            error.response?.data?.message ||
            "Failed to update leave status"
        );

    }

};


// ======================================================
// LOGOUT
// ======================================================

const logout = () => {

    localStorage.removeItem(
        "staff"
    );


    localStorage.removeItem(
        "staffUser"
    );


    localStorage.removeItem(
        "staffToken"
    );


    window.location.href =
        "/staff-login";

};
    // ======================================================
    // LOADING SCREEN
    // ======================================================

    if (loading) {

        return (

            <div className="staff-dashboard">
{/* ==================================================
    🚚 MANAGER PERSISTENT DELIVERY ALERT
================================================== */}

{staff?.role === "Manager" &&
    managerDeliveryAlert && (

    <div
        style={{
            background: "#fff3cd",
            border: "3px solid #ff9800",
            borderRadius: "12px",
            padding: "18px",
            marginBottom: "20px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
        }}
    >

        <h2 style={{ margin: "0 0 8px 0" }}>
            🚚 NEW DELIVERY ORDER
        </h2>

        <p style={{ margin: "0 0 12px 0" }}>
            Delivery Order #
            <strong>
                {managerDeliveryAlert.id}
            </strong>
            {" "}has arrived.
        </p>

        <button
            onClick={() => {
                setManagerDeliveryAlert(null);
            }}
        >
            ✅ MARK AS SEEN
        </button>

    </div>

)}
                <h1>
                    👨‍🍳 Staff Dashboard
                </h1>

                <p>
                    Loading orders...
                </p>

            </div>

        );

    }


    // ======================================================
    // DETERMINE CURRENT ROLE
    // ======================================================

    const isDeliveryBoy =
        staff?.role === "DeliveryBoy";


    // ======================================================
    // MAIN UI
    // ======================================================

    return (

        <div className="staff-dashboard">


            {/* ==================================================
                HEADER
            ================================================== */}

            <div className="staff-header">

                <div>

                    <h1>

                        {isDeliveryBoy
                            ? "🚚 Delivery Boy Dashboard"
                            : "👨‍🍳 Staff Dashboard"
                        }

                    </h1>


                    {staff && (

                        <p>

                            Welcome,{" "}

                            <strong>
                                {staff.name}
                            </strong>

                            {" | "}

                            Role:{" "}

                            <strong>
                                {staff.role}
                            </strong>

                        </p>

                    )}

                </div>


                {/* ==================================================
                    NOTIFICATION BUTTON
                ================================================== */}

                <button
                    onClick={
                        handleNotificationButton
                    }
                >

                    {notificationEnabled

                        ? "🔔 Notifications On"

                        : "🔔 Enable Notifications"

                    }

                </button>


                {/* ==================================================
                    LOGOUT
                ================================================== */}

                <button
                    onClick={
                        logout
                    }
                >

                    Logout

                </button>

            </div>



            {/* ==================================================
                DELIVERY BOY INFORMATION
            ================================================== */}

            {isDeliveryBoy && (

                <div className="delivery-info">

                    <h2>
                        🚚 My Assigned Orders
                    </h2>

                    <p>
                        এখানে শুধুমাত্র তোমার account-এ
                        assigned করা orders দেখানো হবে।
                    </p>


                    <button
                        onClick={
                            applyLeave
                        }
                    >

                        {staff?.on_leave === 1

                            ? "🔙 Return to Work"

                            : "🏖️ Apply Leave"

                        }

                    </button>

                </div>

            )}



            {/* ==================================================
                SUMMARY
            ================================================== */}

            <div className="staff-summary">


                {/* TOTAL / MY ORDERS */}

                <div className="summary-card">

                    <h3>

                        {isDeliveryBoy
                            ? "My Orders"
                            : "Total Orders"
                        }

                    </h3>


                    <strong>

                        {
                            orders.length
                        }

                    </strong>

                </div>



                {/* PENDING / ASSIGNED */}

                <div className="summary-card">

                    <h3>

                        {isDeliveryBoy
                            ? "Assigned"
                            : "Pending"
                        }

                    </h3>


                    <strong>

                        {

                            isDeliveryBoy

                                ? orders.filter(
                                    order =>
                                        order.delivery_status ===
                                        "Assigned"
                                ).length

                                : orders.filter(
                                    order =>
                                        order.order_status ===
                                        "Pending"
                                ).length

                        }

                    </strong>

                </div>



                {/* ACCEPTED / PREPARING */}

                <div className="summary-card">

                    <h3>

                        {isDeliveryBoy
                            ? "Accepted"
                            : "Preparing"
                        }

                    </h3>


                    <strong>

                        {

                            isDeliveryBoy

                                ? orders.filter(
                                    order =>
                                        order.delivery_status ===
                                        "Accepted"
                                ).length

                                : orders.filter(
                                    order =>
                                        order.order_status ===
                                        "Preparing"
                                ).length

                        }

                    </strong>

                </div>



                {/* OUT FOR DELIVERY / READY */}

                <div className="summary-card">

                    <h3>

                        {isDeliveryBoy
                            ? "Out For Delivery"
                            : "Ready"
                        }

                    </h3>


                    <strong>

                        {

                            isDeliveryBoy

                                ? orders.filter(
                                    order =>
                                        order.delivery_status ===
                                        "OutForDelivery"
                                ).length

                                : orders.filter(
                                    order =>
                                        order.order_status ===
                                        "Ready"
                                ).length

                        }

                    </strong>

                </div>

            </div>



            {/* ==================================================
                ERROR MESSAGE
            ================================================== */}

            {error && (

                <div className="staff-error">

                    ⚠️ {error}


                    <button
                        onClick={
                            loadOrders
                        }
                    >

                        Retry

                    </button>

                </div>

            )}



            {/* ==================================================
                ORDERS CONTAINER
            ================================================== */}

            <div className="orders-container">


                {orders.length === 0 ? (

                    <div className="no-orders">

                        <h2>

                            {isDeliveryBoy
                                ? "No Assigned Orders"
                                : "No Orders"
                            }

                        </h2>


                        <p>

                            {isDeliveryBoy

                                ? "No delivery orders are currently assigned to you."

                                : "New customer orders will appear here."

                            }

                        </p>

                    </div>

                ) : (


                    orders.map(
                        (order) => (

                            <div
                                className="order-card"
                                key={
                                    isDeliveryBoy
                                        ? `delivery-${order.assignment_id}`
                                        : `order-${order.id}`
                                }
                            >


                                {/* ==================================================
                                    ORDER HEADER
                                ================================================== */}

                                <div className="order-header">

                                    <h2>

                                        Order #

                                        {
                                            order.order_id ||
                                            order.id
                                        }

                                    </h2>


                                    <span>

                                        {

                                            isDeliveryBoy

                                                ? order.delivery_status ||
                                                  "Assigned"

                                                : order.order_status

                                        }

                                    </span>

                                </div>



                                {/* ==================================================
                                    CUSTOMER ID
                                ================================================== */}

                                <p>

                                    <strong>
                                        Customer ID:
                                    </strong>{" "}

                                    {
                                        order.customer_id ||
                                        "-"
                                    }

                                </p>



                                {/* ==================================================
                                    DELIVERY CUSTOMER INFORMATION
                                ================================================== */}

                                {isDeliveryBoy && (

                                    <>

                                        <p>

                                            <strong>
                                                Customer Name:
                                            </strong>{" "}

                                            {
                                                order.customer_name ||
                                                "-"
                                            }

                                        </p>


                                        <p>

                                            <strong>
                                                Customer Phone:
                                            </strong>{" "}

                                            {
                                                order.customer_phone ||
                                                "-"
                                            }

                                        </p>


                                        <p>

                                            <strong>
                                                Delivery Address:
                                            </strong>{" "}

                                            {
                                                order.delivery_address ||
                                                "-"
                                            }

                                        </p>


                                        <p>

                                            <strong>
                                                📌 Landmark:
                                            </strong>{" "}

                                            {
                                                order.delivery_landmark ||
                                                "-"
                                            }

                                        </p>

                                    </>

                                )}



                                {/* ==================================================
                                    TABLE
                                ================================================== */}

                                <p>

                                    <strong>
                                        Table:
                                    </strong>{" "}

                                    {
                                        order.table_number ||
                                        "-"
                                    }

                                </p>



                                {/* ==================================================
                                    ORDER TYPE
                                ================================================== */}

                                <p>

                                    <strong>
                                        Order Type:
                                    </strong>{" "}

                                    {
                                        order.order_type ||
                                        "-"
                                    }

                                </p>



                                {/* ==================================================
                                    PAYMENT STATUS
                                ================================================== */}

                                <p>

                                    <strong>
                                        Payment:
                                    </strong>{" "}

                                    {
                                        order.payment_status ||
                                        "-"
                                    }

                                </p>



                                {/* ==================================================
                                    PAYMENT METHOD
                                ================================================== */}

                                <p>

                                    <strong>
                                        Payment Method:
                                    </strong>{" "}

                                    {
                                        order.payment_method ||
                                        "NOT FOUND"
                                    }

                                </p>



                                {/* ==================================================
                                    TOTAL
                                ================================================== */}

                                <p>

                                    <strong>
                                        Total:
                                    </strong>{" "}

                                    ₹

                                    {
                                        order.total_amount ||
                                        0
                                    }

                                </p>

{/* ==================================
    CASHBACK TO GIVE
================================== */}

{
    isDeliveryBoy &&
    Number(order.cashback_amount || 0) > 0 &&
    order.cashback_status !== "Paid" &&
    (

        <div
            style={{
                marginTop: "15px",
                padding: "15px",
                background: "#e8f5e9",
                borderRadius: "10px",
                border: "1px solid #81c784"
            }}
        >

            <h3>
                💰 Cashback to Give
            </h3>

            <p>

                <strong>
                    Customer Cashback:
                </strong>{" "}

                ₹
                {Number(
                    order.cashback_amount || 0
                ).toFixed(2)}

            </p>

            <p>
                Delivery complete করার পরে
                customer-কে এই cashback amount
                cash হিসেবে দিতে হবে।
            </p>

        </div>

    )
}

                                {/* ==================================================
                                    COD SECTION
                                    DeliveryBoy only
                                ================================================== */}

                                {

                                    isDeliveryBoy &&

                                    order.payment_method ===
                                        "Cash" &&

                                    order.payment_status ===
                                        "Pending" &&

                                    (

                                        <div
                                            style={{
                                                marginTop:
                                                    "15px",

                                                padding:
                                                    "15px",

                                                background:
                                                    "#fff3cd",

                                                borderRadius:
                                                    "10px",

                                                border:
                                                    "1px solid #f0d36b"
                                            }}
                                        >

                                            <h3>
                                                💵 Cash on Delivery
                                            </h3>


                                            <p>

                                                <strong>
                                                    Amount to collect from customer:
                                                </strong>{" "}

                                                ₹

                                                {
                                                    Number(
                                                        order.total_amount ||
                                                        0
                                                    ).toFixed(2)
                                                }

                                            </p>


                                            <p>
                                                Customer-এর কাছ থেকে cash নেওয়ার পরে
                                                এই amount Shop Owner-কে payment করতে হবে।
                                            </p>


                                            <div>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setShowOwnerQrScanner(
                                                            order.assignment_id
                                                        )
                                                    }
                                                >

                                                    📱 Scan Shop Owner QR

                                                </button>


                                                {
                                                    showOwnerQrScanner ===
                                                        order.assignment_id &&

                                                    (

                                                        <div
                                                            id={
                                                                `owner-qr-reader-${order.assignment_id}`
                                                            }

                                                            style={{
                                                                marginTop:
                                                                    "15px",

                                                                width:
                                                                    "100%",

                                                                maxWidth:
                                                                    "400px"
                                                            }}
                                                        />

                                                    )
                                                }

                                            </div>

                                        </div>

                                    )

                                }
           {/* ==================================
    DELIVERY INFORMATION
================================== */}

{isDeliveryBoy && (

    <div className="delivery-order-info">

        <h3>
            🚚 Delivery Information
        </h3>

        <p>
            <strong>
                Delivery Boy ID:
            </strong>{" "}

            {
                order.delivery_boy_id ||
                staff?.id ||
                "-"
            }

        </p>

        <p>
            <strong>
                Assignment ID:
            </strong>{" "}

            {
                order.assignment_id ||
                "-"
            }

        </p>

        <p>
            <strong>
                🏪 Shop Name:
            </strong>{" "}

            {
                order.shop_name ||
                "-"
            }
        </p>

        <p>
            <strong>
                📞 Shop Phone:
            </strong>{" "}

            {
                order.shop_phone ||
                "-"
            }
        </p>

        <p>
            <strong>
                Assignment Status:
            </strong>{" "}

            {
                order.delivery_status ||
                "Assigned"
            }

        </p>

        <p>
            <strong>
                Assigned At:
            </strong>{" "}

            {
                order.assigned_at ||
                "-"
            }

        </p>

    </div>

)}


{/* ==================================
    ORDER ITEMS
================================== */}

{
    Array.isArray(order.items) &&
    order.items.length > 0 &&
    (

        <div className="order-items">

            <h3>
                Items
            </h3>

            <ul>

                {
                    order.items.map(
                        (
                            item,
                            index
                        ) => (

                            <li
                                key={index}
                            >

                                {
                                    item.name ||
                                    item.item_name ||
                                    "Item"
                                }

                                {" × "}

                                {
                                    item.quantity
                                }

                            </li>

                        )
                    )
                }

            </ul>

        </div>

    )
}


{/* ==================================
    ACTIONS
================================== */}

<div className="order-actions">


    {/* ==================================
        NORMAL STAFF ACTIONS
    ================================== */}

    {!isDeliveryBoy && (

        <>

            {
                order.order_status ===
                "Pending" &&
                (

                    <button
                        onClick={() =>
                            acceptOrder(
                                order.id
                            )
                        }
                    >

                        ✅ Accept Order

                    </button>

                )
            }


            {
                order.order_status ===
                "Accepted" &&
                (

                    <button
                        onClick={() =>
                            startPreparing(
                                order.id
                            )
                        }
                    >

                        🍳 Start Preparing

                    </button>

                )
            }


            {
                order.order_status ===
                "Preparing" &&
                (

                    <button
                        onClick={() =>
                            markReady(
                                order.id
                            )
                        }
                    >

                        ✅ Mark Ready

                    </button>

                )
            }


            {
                order.order_status ===
                "Ready" &&
                (

                    <button
                        onClick={() =>
                            completeOrder(
                                order.id
                            )
                        }
                    >

                        ✅ Complete Order

                    </button>

                )
            }


            {/* WALK-IN */}

            <button
                onClick={() =>
                    navigate(
                        "/staff/walk-in"
                    )
                }
            >

                🧓 Walk-in Customer

            </button>

        </>

    )}



    {/* ==================================
        DELIVERY BOY ACTIONS
    ================================== */}

    {isDeliveryBoy && (

        <div>


            {/* ==================================
                ASSIGNED
            ================================== */}

            {
                order.delivery_status ===
                "Assigned" &&
                (

                    <button
                        onClick={() =>
                            acceptDelivery(
                                order.assignment_id
                            )
                        }
                    >

                        ✅ Accept Delivery

                    </button>

                )
            }



            {/* ==================================
                ACCEPTED → GOING TO SHOP
            ================================== */}

            {
                order.delivery_status ===
                "Accepted" &&
                (

                    <div>

                        <strong>
                            🟢 Delivery Accepted
                        </strong>

                        <p>
                            🚚 Going to shop...
                        </p>


                        {/* NAVIGATE TO SHOP */}

                        <button
                            onClick={() => {

                                const latitude =
                                    order.shop_latitude;

                                const longitude =
                                    order.shop_longitude;

                                if (
                                    latitude == null ||
                                    longitude == null
                                ) {

                                    alert(
                                        "Shop location is not available."
                                    );

                                    return;

                                }

                                window.open(
                                    `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
                                    "_blank"
                                );

                            }}
                        >

                            🗺️ Navigate to Shop

                        </button>


                        {/* PICKUP */}

                        <button
                            onClick={() =>
                                pickupDelivery(
                                    order.assignment_id
                                )
                            }
                        >

                            📦 Picked Up Order

                        </button>

                    </div>

                )
            }



            {/* ==================================
                OUT FOR DELIVERY
            ================================== */}

            {
                order.delivery_status ===
                "OutForDelivery" &&
                (

                    <div>

                        <strong>
                            📦 Order Picked Up
                        </strong>

                        <p>
                            🚚 Going to customer...
                        </p>


                        {/* NAVIGATE TO CUSTOMER */}

                        <button
                            onClick={() => {

                                console.log(
                                    "========== CUSTOMER LOCATION =========="
                                );

                                console.log(
                                    "Order ID:",
                                    order.id
                                );

                                console.log(
                                    "Customer Latitude:",
                                    order.customer_latitude
                                );

                                console.log(
                                    "Customer Longitude:",
                                    order.customer_longitude
                                );

                                console.log(
                                    "Full Order:",
                                    order
                                );

                                console.log(
                                    "======================================="
                                );


                                const latitude =
                                    order.customer_latitude;

                                const longitude =
                                    order.customer_longitude;


                                if (
                                    latitude == null ||
                                    longitude == null
                                ) {

                                    alert(
                                        "Customer location is not available."
                                    );

                                    return;

                                }


                                console.log(
                                    "🚨 CUSTOMER NAVIGATION DEBUG"
                                );

                                console.log(
                                    "Order ID =",
                                    order.order_id
                                );

                                console.log(
                                    "Customer Address =",
                                    order.delivery_address
                                );

                                console.log(
                                    "Customer Latitude =",
                                    order.customer_latitude
                                );

                                console.log(
                                    "Customer Longitude =",
                                    order.customer_longitude
                                );

                                console.log(
                                    "Google Maps Destination =",
                                    `${order.customer_latitude},${order.customer_longitude}`
                                );


                                window.open(
                                    `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
                                    "_blank"
                                );

                            }}
                        >

                            🗺️ Navigate to Customer

                        </button>



                        {/* MARK DELIVERED */}

                        <button
                            onClick={async () => {

                                try {

                                    console.log(
                                        "========== MARK AS DELIVERED =========="
                                    );

                                    console.log(
                                        "Assignment ID =",
                                        order.assignment_id
                                    );

                                    console.log(
                                        "Order ID =",
                                        order.order_id
                                    );


                                    const staffToken =
                                        localStorage.getItem(
                                            "staffToken"
                                        );


                                    if (!staffToken) {

                                        alert(
                                            "DeliveryBoy login token not found. Please login again."
                                        );

                                        return;

                                    }


                                    console.log(
                                        "🚚 DELIVER STAFF TOKEN EXISTS =",
                                        true
                                    );


                                    const response =
                                        await fetch(
                                           `${API_URL}/delivery-assignments/deliver/${order.assignment_id}`,
                                            {
                                                method:
                                                    "PATCH",

                                                headers: {
                                                    "Content-Type":
                                                        "application/json",

                                                    Authorization:
                                                        `Bearer ${staffToken}`
                                                }
                                            }
                                        );


                                    const data =
                                        await response.json();


                                    console.log(
                                        "DELIVER RESPONSE =",
                                        data
                                    );


                                    if (!response.ok) {

                                        alert(
                                            data.message ||
                                            "Failed to mark order as delivered."
                                        );

                                        return;

                                    }


                                    alert(
                                        "✅ Order delivered successfully!"
                                    );


                                    setOrders(
                                        prevOrders =>
                                            prevOrders.map(
                                                item =>

                                                    Number(
                                                        item.assignment_id
                                                    ) ===
                                                    Number(
                                                        order.assignment_id
                                                    )

                                                        ? {
                                                            ...item,
                                                            delivery_status:
                                                                "Delivered"
                                                        }

                                                        : item
                                            )
                                    );

                                }

                                catch (error) {

                                    console.log(
                                        "❌ MARK DELIVERED ERROR =",
                                        error
                                    );

                                    alert(
                                        "Server Error while completing delivery."
                                    );

                                }

                            }}
                        >

                            ✅ Mark as Delivered

                        </button>

                    </div>

                )
            }

        </div>

    )}



    {/* ==================================
        COMPLETED
    ================================== */}

    {
        !isDeliveryBoy &&
        order.order_status ===
        "Completed" &&
        (

            <button
                disabled
            >

                ✔ Completed

            </button>

        )
    }

{/* ==================================
    CASHBACK SETTLEMENT
================================== */}

{
    isDeliveryBoy &&
    order.delivery_status === "Delivered" &&
    Number(order.cashback_amount || 0) > 0 &&
    order.cashback_status !== "Paid" &&
    (

        <button
            onClick={async () => {

                try {

                    const staffToken =
                        localStorage.getItem(
                            "staffToken"
                        );

                    if (!staffToken) {

                        alert(
                            "DeliveryBoy login token not found. Please login again."
                        );

                        return;

                    }

                    const confirmed =
                        window.confirm(
                            `Have you physically given ₹${Number(
                                order.cashback_amount
                            ).toFixed(2)} cashback to the customer?`
                        );

                    if (!confirmed) {
                        return;
                    }

                    const response =
                        await fetch(
                            `${API_URL}/delivery-assignments/settle-cash/${order.assignment_id}`,
                            {
                                method: "PATCH",

                                headers: {
                                    "Content-Type":
                                        "application/json",

                                    Authorization:
                                        `Bearer ${staffToken}`
                                }
                            }
                        );

                    const data =
                        await response.json();

                    console.log(
                        "💰 CASHBACK SETTLEMENT RESPONSE =",
                        data
                    );

                    if (!response.ok) {

                        alert(
                            data.message ||
                            "Failed to settle cashback."
                        );

                        return;

                    }

                    alert(
                        `✅ ₹${Number(
                            data.cashbackAmount
                        ).toFixed(2)} cashback given to customer.`
                    );

                    setOrders(
                        prevOrders =>
                            prevOrders.map(
                                item =>

                                    Number(
                                        item.assignment_id
                                    ) ===
                                    Number(
                                        order.assignment_id
                                    )

                                        ? {
                                            ...item,
                                            cashback_status:
                                                "Paid",
                                            cashback_paid_by:
                                                staff?.id
                                        }

                                        : item
                            )
                    );

                }

                catch (error) {

                    console.log(
                        "❌ CASHBACK SETTLEMENT ERROR =",
                        error
                    );

                    alert(
                        "Server Error while settling cashback."
                    );

                }

            }}
        >

            ✅ Cashback Given

        </button>

    )
}

    {/* ==================================
        CANCELLATION CASH SETTLEMENT
    ================================== */}

    {
        isDeliveryBoy &&
        Number(
            order.pending_cancellation_amount
        ) > 0 &&
        (

            <button
                onClick={async () => {

                    try {

                        const staffToken =
                            localStorage.getItem(
                                "staffToken"
                            );


                        if (!staffToken) {

                            alert(
                                "DeliveryBoy login token not found. Please login again."
                            );

                            return;

                        }


                        const confirmed =
                            window.confirm(
                                `Have you physically given ₹${Number(
                                    order.pending_cancellation_amount
                                ).toFixed(2)} cash to the customer?`
                            );


                        if (!confirmed) {

                            return;

                        }


                        const response =
                            await fetch(
                                `${API_URL}/delivery-assignments/settle-cancellation-cash`,
                                {
                                    method:
                                        "PATCH",

                                    headers: {
                                        "Content-Type":
                                            "application/json",

                                        Authorization:
                                            `Bearer ${staffToken}`
                                    },

                                    body:
                                        JSON.stringify({
                                            customer_id:
                                                order.customer_id
                                        })
                                }
                            );


                        const data =
                            await response.json();


                        console.log(
                            "💵 CASH SETTLEMENT RESPONSE =",
                            data
                        );


                        if (!response.ok) {

                            alert(
                                data.message ||
                                "Failed to settle cancellation cash."
                            );

                            return;

                        }


                        alert(
                            `✅ ₹${Number(
                                data.amount_settled
                            ).toFixed(2)} cash settlement completed.`
                        );


                        setOrders(
                            prevOrders =>
                                prevOrders.map(
                                    item =>

                                        Number(
                                            item.assignment_id
                                        ) ===
                                        Number(
                                            order.assignment_id
                                        )

                                            ? {
                                                ...item,
                                                pending_cancellation_amount:
                                                    0
                                            }

                                            : item
                                )
                        );

                    }

                    catch (error) {

                        console.log(
                            "❌ CASH SETTLEMENT ERROR =",
                            error
                        );

                        alert(
                            "Server Error while settling cancellation cash."
                        );

                    }

                }}
            >

                💵 Cash Given to Customer

            </button>

        )
    }



    {/* ==================================
        CANCELLED
    ================================== */}

    {
        !isDeliveryBoy &&
        order.order_status ===
        "Cancelled" &&
        (

            <button
                disabled
            >

                ❌ Cancelled

            </button>

        )
    }

                                </div>
                            </div>

                        )

                    )

                )}

            </div>

        </div>

    );

}

export default StaffDashboard;                        