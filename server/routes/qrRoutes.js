const express = require("express");

const router = express.Router();

const {

    generateQR

} = require("../controllers/qrController");

router.get(

    "/:qrCode",

    generateQR

);

module.exports = router;