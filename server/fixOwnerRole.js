require("dotenv").config();

const db = require("./config/db");

db.query(
    "UPDATE users SET role = 'owner' WHERE id = 3",
    (err, result) => {

        if (err) {
            console.log("ERROR:", err);
        } else {
            console.log("SUCCESS:", result);
        }

        db.end();
    }
);