const jwt = require("jsonwebtoken");
const authMiddleware = (req, res, next) => {

    const authHeader = req.headers.authorization;

    console.log("AUTH HEADER =", authHeader);
        if (!authHeader) {

        return res.status(401).json({

            message: "Authorization token missing"

        });

    }

    const token = authHeader.split(" ")[1];
console.log("TOKEN RECEIVED =", token);
console.log("JWT SECRET =", process.env.JWT_SECRET);
    console.log("TOKEN =", token);
        try {

        const decoded = jwt.verify(

            token,

            process.env.JWT_SECRET

        );

        console.log("DECODED USER =", decoded);

        req.user = decoded;

        next();

    }
        catch (error) {

        console.log("JWT ERROR =", error.message);
console.log(error);
        return res.status(401).json({

            message: "Invalid Token"

        });

    }

};

module.exports = authMiddleware;