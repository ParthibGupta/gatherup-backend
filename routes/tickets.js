const express = require("express");
const router = express.Router();
const TicketController = require("../controllers/ticketController");
const { authenticate } = require("../middleware/authMiddleware");

// Purchase/Request ticket
router.post(
  "/events/:eventID/tickets",
  authenticate,
  TicketController.purchaseTicket
);

// Get user's tickets
router.get("/my-tickets", authenticate, TicketController.getUserTickets);

// Verify ticket (for check-in)
router.get("/verify/:ticketNumber", TicketController.verifyTicket);

// Use ticket (check-in)
router.post("/use/:ticketNumber", TicketController.useTicket);

// Get event tickets (for organizers)
router.get(
  "/events/:eventID/tickets",
  authenticate,
  TicketController.getEventTickets
);

// Revoke ticket
router.post(
  "/tickets/:ticketID/revoke",
  authenticate,
  TicketController.revokeTicket
);

// Approve/Reject ticket
router.post(
  "/tickets/:ticketID/approve",
  authenticate,
  TicketController.approveTicket
);

module.exports = router;
