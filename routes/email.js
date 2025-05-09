
const express = require("express");
const router = express.Router();
const { sendEventUpdateBulkEmail } = require("../controllers/emailController");

router.post("/eventUpdate", sendEventUpdateBulkEmail);

module.exports = router;