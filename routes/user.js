const express = require("express");
const router = express.Router();

const { getCurrentUser, addNewUser } = require("../controllers/userController");
const { getMyOrganizedEvents, getMyJoinedEvents } = require("../controllers/eventController");
const { authenticate, verifyInternalKey } = require("../middleware/authMiddleware");

router.get("/", authenticate, getCurrentUser);
router.post("/", verifyInternalKey, addNewUser);

router.get("/joinedEvents", authenticate, getMyJoinedEvents);
router.get("/organizedEvents", authenticate, getMyOrganizedEvents);

module.exports = router;
