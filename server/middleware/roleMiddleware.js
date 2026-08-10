const requireRole = (...allowedRoles) => {

    return (req, res, next) => {

        // User login/authenticated কিনা
        if (!req.user) {

            return res.status(401).json({

                success: false,
                message: "Authentication required"

            });

        }

        // User-এর role অনুমোদিত কিনা
        if (!allowedRoles.includes(req.user.role)) {

            return res.status(403).json({

                success: false,
                message: "Access denied"

            });

        }

        next();

    };

};

module.exports = requireRole;