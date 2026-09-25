const db = require("../config/db");

console.log("CUSTOMER CONTROLLER LOADED");


// ==============================
// GET ALL CUSTOMERS
// ==============================
exports.getCustomers = (req, res) => {

    console.log("GET CUSTOMERS API RUNNING");

    const sql = "SELECT * FROM customers";

    db.query(sql, (err, results) => {

        if (err) {

            console.log("DATABASE ERROR:", err);

            return res.status(500).json({
                message: "Database Error"
            });

        }


        console.log("MYSQL DATA:", results);


        res.status(200).json(results);

    });

};



// ==============================
// ADD CUSTOMER
// ==============================
// ==============================
// ADD CUSTOMER
// ==============================
exports.createCustomer = (req, res) => {

    console.log("🔥 CREATE CUSTOMER FUNCTION RUNNING");

    console.log("REQUEST BODY:", req.body);


    const {
        name,
        phone,
        orderType,
        tableNumber,
        delivery_address,
        latitude,
        longitude
    } = req.body;


    const sql = `
        INSERT INTO customers
        (
            name,
            phone,
            orderType,
            tableNumber,
            delivery_address,
            latitude,
            longitude
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;


    db.query(
        sql,
        [
            name,
            phone,
            orderType,
            tableNumber || null,
            delivery_address || null,
            latitude || null,
            longitude || null
        ],

        (err, result) => {

            if (err) {

                console.log(
                    "MYSQL INSERT ERROR:",
                    err
                );

                return res.status(500).json({
                    message: "Database Error"
                });

            }


            console.log(
                "INSERT SUCCESS:",
                result
            );


            res.status(201).json({

                message:
                    "Customer Added Successfully",

                customerId:
                    result.insertId

            });

        }
    );

};