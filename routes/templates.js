const express = require("express");
const router = express.Router();
const TemplateController = require("../controllers/templateController");
const { authenticate } = require("../middleware/authMiddleware");

// Get ticket template for editing (admin only)
router.get("/ticket", authenticate, TemplateController.getTicketTemplate);

// Update ticket template (admin only)
router.put("/ticket", authenticate, TemplateController.updateTicketTemplate);

// Preview ticket template with sample data
router.get("/ticket/preview", TemplateController.previewTicketTemplate);

// Restore ticket template from backup (admin only)
router.post(
  "/ticket/restore",
  authenticate,
  TemplateController.restoreTicketTemplate
);

module.exports = router;
