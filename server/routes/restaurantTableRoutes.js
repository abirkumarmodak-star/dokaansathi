const express = require("express");

const router = express.Router();

const {

    updateTableStatus

} = require("../controllers/restaurantTableController");

// ======================================
// UPDATE TABLE STATUS
// ======================================

router.patch(

    "/status",

    updateTableStatus

);

module.exports = router;