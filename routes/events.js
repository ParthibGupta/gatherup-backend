const express = require("express");
const router = express.Router();

const { createEvent } = require("../controllers/eventController");
const authenticate = require("../middleware/authMiddleware");

router.post("/", authenticate, createEvent);

module.exports = router;
