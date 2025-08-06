const express = require("express");
const router = express.Router();

const { getCurrentUser, addNewUser, getUserProfile, updateUserProfile } = require("../controllers/userController");
const { getMyOrganizedEvents, getMyJoinedEvents } = require("../controllers/eventController");
const { authenticate, verifyInternalKey } = require("../middleware/authMiddleware");

router.get("/", authenticate, getCurrentUser);
router.post("/", verifyInternalKey, addNewUser);

router.get("/joinedEvents", authenticate, getMyJoinedEvents);
router.get("/organizedEvents", authenticate, getMyOrganizedEvents);
router.get("/profile", authenticate, getUserProfile);
router.put("/profile/update", authenticate, updateUserProfile);

module.exports = router;
