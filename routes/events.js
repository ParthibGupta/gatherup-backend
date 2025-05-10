const express = require("express");
const router = express.Router();

const { createEvent, getAllEvents, getEventByID, joinEventByID, updateMyOrganizedEventByID } = require("../controllers/eventController");
const { authenticate } = require("../middleware/authMiddleware");

router.post("/", authenticate, createEvent);
router.get("/", getAllEvents);
router.get("/:eventID", getEventByID);

router.post("/join/:eventID",authenticate, joinEventByID);
router.put("/update/:eventID",authenticate, updateMyOrganizedEventByID);

module.exports = router;
