console.log("✅ ROLE MIDDLEWARE FILE LOADED");
const requireRole = (...allowedRoles) => {

    return (req, res, next) => {

        console.log("========== ROLE DEBUG ==========");
        console.log("REQ.USER =", req.user);
        console.log("USER ROLE =", req.user?.role);
        console.log("ALLOWED ROLES =", allowedRoles);
        console.log("================================");

        // User login/authenticated কিনা
        if (!req.user) {

            console.log("❌ NO req.user");

            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });

        }

        // User-এর role অনুমোদিত কিনা
        if (!allowedRoles.includes(req.user.role)) {

            console.log(
                "❌ ROLE MISMATCH:",
                req.user.role,
                "EXPECTED:",
                allowedRoles
            );

            return res.status(403).json({
                success: false,
                message: "Access denied"
            });

        }

        console.log("✅ ROLE AUTHORIZED");

        next();
    };
};

module.exports = requireRole;