const jwt = require("jsonwebtoken");


// ======================================================
// AUTHENTICATION MIDDLEWARE
// ======================================================
console.log("🔥🔥🔥 AUTH MIDDLEWARE CURRENT FILE EXECUTED 🔥🔥🔥");
const authMiddleware = (req, res, next) => {

    console.log("🔵 [AUTH-1] AUTH MIDDLEWARE ENTERED");
    console.log("🔵 [AUTH-1] URL =", req.originalUrl);

    const authHeader = req.headers.authorization;

    console.log(
        "🔵 [AUTH-2] AUTH HEADER =",
        authHeader
    );

    if (!authHeader) {

        console.log("🔴 [AUTH-3] HEADER MISSING");

        return res.status(401).json({
            success: false,
            message: "Authorization token missing"
        });
    }

    const parts = authHeader.split(" ");

    console.log(
        "🔵 [AUTH-4] AUTH PARTS LENGTH =",
        parts.length
    );

    if (
        parts.length !== 2 ||
        parts[0] !== "Bearer" ||
        !parts[1]
    ) {

        console.log("🔴 [AUTH-5] INVALID BEARER FORMAT");

        return res.status(401).json({
            success: false,
            message: "Invalid Authorization format"
        });
    }

    const token = parts[1];
console.log("========== TOKEN DEBUG ==========");
console.log("TOKEN TYPE =", typeof token);
console.log("TOKEN LENGTH =", token?.length);
console.log("TOKEN START =", token?.substring(0, 20));
console.log("TOKEN END =", token?.substring(token.length - 20));
console.log("================================");
    console.log(
        "🔵 [AUTH-6] TOKEN RECEIVED =",
        !!token
    );

    console.log(
        "🔵 [AUTH-6] TOKEN LENGTH =",
        token.length
    );

    console.log(
        "🔵 [AUTH-6] JWT SECRET EXISTS =",
        !!process.env.JWT_SECRET
    );

    try {

        console.log("🔵 [AUTH-7] STARTING JWT VERIFY");

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        console.log(
            "🟢 [AUTH-8] JWT VERIFIED"
        );

        console.log(
            "🟢 [AUTH-8] DECODED =",
            decoded
        );

        req.user = decoded;

        console.log(
            "🟢 [AUTH-9] CALLING NEXT()"
        );

        next();

    } catch (error) {

        console.log("🔴🔴🔴 [AUTH-ERROR] JWT VERIFY FAILED");
        console.log("ERROR NAME =", error.name);
        console.log("ERROR MESSAGE =", error.message);
        console.log("SECRET EXISTS =", !!process.env.JWT_SECRET);
        console.log("TOKEN EXISTS =", !!token);

        return res.status(401).json({
            success: false,
            message: "JWT DEBUG",
            errorName: error.name,
            errorMessage: error.message,
            secretExists: !!process.env.JWT_SECRET,
            tokenReceived: !!token
        });
    }
};

// ======================================================
// EXPORT
// ======================================================

module.exports = authMiddleware;