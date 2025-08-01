
const express = require("express");
const router = express.Router();
const { sendEventUpdateBulkEmail, sendToEventOrganizer } = require("../controllers/emailController");
const { se } = require("date-fns/locale");

router.post("/eventUpdate", sendEventUpdateBulkEmail);
router.post("/contactOrganizer", sendToEventOrganizer);

module.exports = router;