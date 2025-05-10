
const express = require("express");
const router = express.Router();
const { getAIDescription } = require("../controllers/aiController");
const { authenticate } = require("../middleware/authMiddleware");

router.post("/description", authenticate, getAIDescription);

module.exports = router;