const fs = require("fs");
const path = require("path");

class TemplateController {
  // Get ticket template for editing
  static async getTicketTemplate(req, res) {
    try {
      const templatePath = path.join(
        __dirname,
        "../templates/ticketTemplate.html"
      );
      const htmlContent = fs.readFileSync(templatePath, "utf8");

      res.json({
        message: "Ticket template retrieved successfully",
        status: "success",
        data: {
          template: htmlContent,
        },
      });
    } catch (error) {
      console.error("Error reading ticket template:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // Update ticket template
  static async updateTicketTemplate(req, res) {
    try {
      const { template } = req.body;

      if (!template) {
        return res
          .status(400)
          .json({ message: "Template content is required" });
      }

      const templatePath = path.join(
        __dirname,
        "../templates/ticketTemplate.html"
      );

      // Create backup of current template
      const backupPath = path.join(
        __dirname,
        "../templates/ticketTemplate.backup.html"
      );
      if (fs.existsSync(templatePath)) {
        fs.copyFileSync(templatePath, backupPath);
      }

      // Write new template
      fs.writeFileSync(templatePath, template, "utf8");

      res.json({
        message: "Ticket template updated successfully",
        status: "success",
      });
    } catch (error) {
      console.error("Error updating ticket template:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // Preview ticket template with sample data
  static async previewTicketTemplate(req, res) {
    try {
      const templatePath = path.join(
        __dirname,
        "../templates/ticketTemplate.html"
      );
      let htmlContent = fs.readFileSync(templatePath, "utf8");

      // Sample data for preview
      const sampleData = {
        eventName: "Sample Tech Conference 2025",
        eventDate: "Friday, August 15, 2025",
        eventTime: "09:00 AM",
        location: "Tech Convention Center, San Francisco",
        attendeeName: "John Doe",
        attendeeEmail: "john.doe@example.com",
        ticketNumber: "TKT-1692345678901-SAMPLE123",
        qrCodeData:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      };

      // Replace template variables with sample data
      Object.keys(sampleData).forEach((key) => {
        const regex = new RegExp(`{{${key}}}`, "g");
        htmlContent = htmlContent.replace(regex, sampleData[key]);
      });

      res.setHeader("Content-Type", "text/html");
      res.send(htmlContent);
    } catch (error) {
      console.error("Error previewing ticket template:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // Restore template from backup
  static async restoreTicketTemplate(req, res) {
    try {
      const templatePath = path.join(
        __dirname,
        "../templates/ticketTemplate.html"
      );
      const backupPath = path.join(
        __dirname,
        "../templates/ticketTemplate.backup.html"
      );

      if (!fs.existsSync(backupPath)) {
        return res.status(404).json({ message: "No backup template found" });
      }

      fs.copyFileSync(backupPath, templatePath);

      res.json({
        message: "Ticket template restored from backup successfully",
        status: "success",
      });
    } catch (error) {
      console.error("Error restoring ticket template:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
}

module.exports = TemplateController;
