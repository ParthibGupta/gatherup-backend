const express = require("express");
const router = express.Router();

const { getCurrentUser, createUser } = require("../controllers/userController");
const { getMyOrganizedEvents, getMyJoinedEvents } = require("../controllers/eventController");
const authenticate = require("../middleware/authMiddleware");

router.get("/", authenticate, getCurrentUser);
router.get("/joinedEvents", authenticate, getMyJoinedEvents);
router.get("/organizedEvents", authenticate, getMyOrganizedEvents);

router.post("/", createUser);

module.exports = router;
