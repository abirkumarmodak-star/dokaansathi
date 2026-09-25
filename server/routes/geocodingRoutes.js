const express = require("express");

const router = express.Router();

console.log("🔥🔥🔥 NEW GEOCODING ROUTE LOADED 🔥🔥🔥");

// ======================================================
// GET /api/geocode?address=...
// Address → Latitude + Longitude
// ======================================================

router.get("/", async (req, res) => {

    console.log("🚨🚨🚨 GEOCODING API HIT 🚨🚨🚨");

    try {

        // --------------------------------------------------
        // 1. Get address from frontend
        // --------------------------------------------------

        const { address } = req.query;

        console.log("📍 ADDRESS RECEIVED =", address);

        if (!address || !address.trim()) {

            return res.status(400).json({
                success: false,
                message: "Address is required"
            });

        }

        // --------------------------------------------------
        // 2. Add Purulia context
        // --------------------------------------------------

        const searchAddress =
            `${address.trim()}, Purulia, West Bengal, India`;

        console.log("🔎 SEARCHING =", searchAddress);

        // --------------------------------------------------
        // 3. Encode address
        // --------------------------------------------------

        const encodedAddress =
            encodeURIComponent(searchAddress);

        // --------------------------------------------------
        // 4. Nominatim API
        // --------------------------------------------------

        const url =
            `https://nominatim.openstreetmap.org/search` +
            `?format=jsonv2` +
            `&limit=5` +
            `&q=${encodedAddress}`;

        console.log("🌍 NOMINATIM URL =", url);

        // --------------------------------------------------
        // 5. Call Nominatim
        // --------------------------------------------------

        const response = await fetch(url, {

            headers: {

                "User-Agent":
                    "DokaansathiAI/1.0 (local-shop-delivery-system)"

            }

        });

        console.log(
            "🌐 NOMINATIM STATUS =",
            response.status
        );

        // --------------------------------------------------
        // 6. Check API response
        // --------------------------------------------------

        if (!response.ok) {

            throw new Error(
                `Geocoding service returned ${response.status}`
            );

        }

        // --------------------------------------------------
        // 7. Convert response to JSON
        // --------------------------------------------------

        const data = await response.json();

        console.log(
            "📦 NOMINATIM RESULT =",
            data
        );

        // --------------------------------------------------
        // 8. No location found
        // --------------------------------------------------

        if (!data || data.length === 0) {

            console.log(
                "❌ LOCATION NOT FOUND =",
                searchAddress
            );

            return res.json({

                success: false,

                message: "Location not found",

                address: address.trim(),

                results: []

            });

        }

        // --------------------------------------------------
        // 9. Format results
        // --------------------------------------------------

        const results = data.map((item) => {

            return {

                display_name:
                    item.display_name,

                latitude:
                    Number(item.lat),

                longitude:
                    Number(item.lon)

            };

        });

        // --------------------------------------------------
        // 10. Send response to frontend
        // --------------------------------------------------

        console.log(
            "✅ GEOCODING SUCCESS =",
            results
        );

        return res.json({

            success: true,

            address: address.trim(),

            results: results

        });

    }

    // ======================================================
    // ERROR HANDLING
    // ======================================================

    catch (error) {

        console.error(
            "❌❌❌ GEOCODING ERROR ❌❌❌"
        );

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Geocoding failed",

            error: error.message

        });

    }

});


// ======================================================
// EXPORT ROUTER
// ======================================================

module.exports = router;