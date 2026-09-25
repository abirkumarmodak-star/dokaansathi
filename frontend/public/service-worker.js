self.addEventListener("install", () => {

    console.log("🔔 Push Service Worker Installed");

    self.skipWaiting();

});


self.addEventListener("activate", event => {

    event.waitUntil(
        self.clients.claim()
    );

});


// ==================================================
// 🔔 RECEIVE PUSH NOTIFICATION
// ==================================================

self.addEventListener("push", event => {

    console.log(
        "🔔 PUSH NOTIFICATION RECEIVED"
    );

    let data = {};

    try {

        data =
            event.data
                ? event.data.json()
                : {};

    }

    catch (error) {

        console.log(
            "⚠️ Push data is not JSON"
        );

        data = {

            title:
                "🚚 DokaanSathi",

            body:
                "New delivery alert received."

        };

    }


    const title =
        data.title ||
        "🚚 DokaanSathi Delivery Alert";


    const options = {

        body:
            data.body ||
            "You have a new delivery order.",

        icon:
            data.icon ||
            "/favicon.svg",

        badge:
            data.badge ||
            "/favicon.svg",

        tag:
            data.tag ||
            `delivery-alert-${Date.now()}`,

        renotify:
            true,

        requireInteraction:
            true,

        vibrate: [
            500,
            200,
            500,
            200,
            1000
        ],

        silent:
            false,

        data: {

            url:
                data.url ||
                "/staff-dashboard",

            orderId:
                data.orderId ||
                null,

            assignmentId:
                data.assignmentId ||
                null,

            attemptNo:
                data.attemptNo ||
                null

        }

    };


    event.waitUntil(

        Promise.all([

            // ==========================================
            // SHOW BROWSER NOTIFICATION
            // ==========================================

            self.registration.showNotification(
                title,
                options
            ),


            // ==========================================
            // SEND ALERT TO OPEN STAFF DASHBOARD
            // ==========================================

            self.clients.matchAll({

                type:
                    "window",

                includeUncontrolled:
                    true

            }).then(clients => {

                clients.forEach(client => {

                    client.postMessage({

                        type:
                            data.type ||
                            "DELIVERY_ALERT",

                        orderId:
                            data.orderId,

                        assignmentId:
                            data.assignmentId,

                        attemptNo:
                            data.attemptNo

                    });

                });

            })

        ])

    );

});


// ==================================================
// 🔔 NOTIFICATION CLICK
// ==================================================

self.addEventListener(
    "notificationclick",
    event => {

        event.notification.close();

        const url =
            event.notification.data?.url ||
            "/staff-dashboard";


        event.waitUntil(

            self.clients.matchAll({

                type:
                    "window",

                includeUncontrolled:
                    true

            }).then(clients => {

                for (
                    const client of clients
                ) {

                    if (
                        "focus" in client
                    ) {

                        client.navigate(url);

                        return client.focus();

                    }

                }


                if (
                    self.clients.openWindow
                ) {

                    return self.clients.openWindow(
                        url
                    );

                }

            })

        );

    }
);