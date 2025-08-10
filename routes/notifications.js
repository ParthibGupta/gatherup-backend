const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/authMiddleware");
const {
  getNotificationsByUserID,
  createNotificationForOrganizer,
  createNotificationForAttendees,
  updateNotification,
  deleteNotification,
} = require("../controllers/notificationController");

router.get("/", authenticate, getNotificationsByUserID);
router.post("/organizer", createNotificationForOrganizer);
router.post("/attendees", createNotificationForAttendees);
router.put("/:id", authenticate, updateNotification);
router.delete("/:id", authenticate, deleteNotification);

module.exports = router;