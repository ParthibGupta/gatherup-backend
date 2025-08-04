const AppDataSource = require("../config/database");
const QRCode = require("qrcode");
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { In } = require("typeorm");

class TicketController {
  // Purchase/Request a ticket
  static async purchaseTicket(req, res) {
    try {
      const { eventID } = req.params;
      const userID = req.user.userID;

      const eventRepository = AppDataSource.getRepository("Event");
      const ticketRepository = AppDataSource.getRepository("Ticket");
      const userRepository = AppDataSource.getRepository("User");

      // Get event details
      const event = await eventRepository.findOne({
        where: { eventID },
        relations: ["tickets"],
      });

      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      if (!event.ticketingEnabled) {
        return res.status(400).json({
          message: "Ticketing is not enabled for this event",
        });
      }

      // Check if user already has a ticket for this event
      const existingTicket = await ticketRepository.findOne({
        where: {
          event: { eventID },
          user: { userID },
          status: In(["confirmed", "pending", "used"]),
        },
      });

      if (existingTicket) {
        return res.status(400).json({
          message: "You already have a ticket for this event",
        });
      }

      // Check capacity
      const soldTickets = event.tickets.filter((t) =>
        ["confirmed", "used"].includes(t.status)
      ).length;
      if (soldTickets >= event.capacity) {
        return res.status(400).json({ message: "Event is sold out" });
      }

      const user = await userRepository.findOne({ where: { userID } });

      // Create single ticket
      const ticketNumber = await TicketController.generateTicketNumber();
      const qrCode = await TicketController.generateQRCode(ticketNumber);

      const ticket = ticketRepository.create({
        ticketNumber,
        qrCode,
        status: event.requiresApproval ? "pending" : "confirmed",
        event,
        user,
      });

      const savedTicket = await ticketRepository.save(ticket);

      // Generate PDF if confirmed
      if (savedTicket.status === "confirmed") {
        const pdfUrl = await TicketController.generateTicketPDF(
          savedTicket,
          event,
          user
        );
        savedTicket.pdfUrl = pdfUrl;
        await ticketRepository.save(savedTicket);
      }

      res.status(201).json({
        message: event.requiresApproval
          ? "Ticket request submitted for approval"
          : "Ticket purchased successfully",
        ticket: {
          ticketID: savedTicket.ticketID,
          ticketNumber: savedTicket.ticketNumber,
          status: savedTicket.status,
          pdfUrl: savedTicket.pdfUrl,
        },
      });
    } catch (error) {
      console.error("Error purchasing ticket:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // Get user's tickets
  static async getUserTickets(req, res) {
    try {
      const userID = req.user.userID;
      const ticketRepository = AppDataSource.getRepository("Ticket");

      const tickets = await ticketRepository.find({
        where: { user: { userID } },
        relations: ["event"],
        order: { purchaseDate: "DESC" },
      });

      res.json({
        message: "User tickets retrieved successfully",
        status: "success",
        data: {
          tickets: tickets.map((ticket) => ({
            ticketID: ticket.ticketID,
            ticketNumber: ticket.ticketNumber,
            status: ticket.status,
            qrCode: ticket.qrCode,
            purchaseDate: ticket.purchaseDate,
            usedAt: ticket.usedAt,
            pdfUrl: ticket.pdfUrl,
            event: {
              eventID: ticket.event.eventID,
              name: ticket.event.name,
              eventDate: ticket.event.eventDate,
              location: ticket.event.location,
            },
          })),
        },
      });
    } catch (error) {
      console.error("Error fetching user tickets:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // Verify ticket (for event check-in)
  static async verifyTicket(req, res) {
    try {
      const { ticketNumber } = req.params;
      const ticketRepository = AppDataSource.getRepository("Ticket");

      const ticket = await ticketRepository.findOne({
        where: { ticketNumber },
        relations: ["event", "user"],
      });

      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      if (ticket.status === "revoked") {
        return res.status(400).json({
          message: "Ticket has been revoked",
          reason: ticket.revokedReason,
        });
      }

      if (ticket.status === "used") {
        return res.status(400).json({
          message: "Ticket already used",
          usedAt: ticket.usedAt,
        });
      }

      if (ticket.status !== "confirmed") {
        return res.status(400).json({ message: "Ticket is not confirmed" });
      }

      res.json({
        valid: true,
        ticket: {
          ticketID: ticket.ticketID,
          ticketNumber: ticket.ticketNumber,
          status: ticket.status,
          user: {
            fullName: ticket.user.fullName,
            email: ticket.user.email,
          },
          event: {
            name: ticket.event.name,
            eventDate: ticket.event.eventDate,
          },
        },
      });
    } catch (error) {
      console.error("Error verifying ticket:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // Use ticket (check-in)
  static async useTicket(req, res) {
    try {
      const { ticketNumber } = req.params;
      const ticketRepository = AppDataSource.getRepository("Ticket");

      const ticket = await ticketRepository.findOne({
        where: { ticketNumber },
        relations: ["event", "user"],
      });

      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      if (ticket.status !== "confirmed") {
        return res.status(400).json({ message: "Ticket cannot be used" });
      }

      ticket.status = "used";
      ticket.usedAt = new Date();
      await ticketRepository.save(ticket);

      res.json({
        message: "Ticket used successfully",
        ticket: {
          ticketNumber: ticket.ticketNumber,
          usedAt: ticket.usedAt,
          user: ticket.user.fullName,
        },
      });
    } catch (error) {
      console.error("Error using ticket:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // Revoke ticket
  static async revokeTicket(req, res) {
    try {
      const { ticketID } = req.params;
      const { reason } = req.body;
      const ticketRepository = AppDataSource.getRepository("Ticket");

      const ticket = await ticketRepository.findOne({
        where: { ticketID },
        relations: ["event", "user"],
      });

      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      if (ticket.status === "used") {
        return res.status(400).json({ message: "Cannot revoke used ticket" });
      }

      ticket.status = "revoked";
      ticket.revokedAt = new Date();
      ticket.revokedReason = reason || "Revoked by organizer";
      await ticketRepository.save(ticket);

      res.json({
        message: "Ticket revoked successfully",
        ticketNumber: ticket.ticketNumber,
      });
    } catch (error) {
      console.error("Error revoking ticket:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // Get event tickets (for organizers)
  static async getEventTickets(req, res) {
    try {
      const { eventID } = req.params;
      const ticketRepository = AppDataSource.getRepository("Ticket");

      const tickets = await ticketRepository.find({
        where: { event: { eventID } },
        relations: ["user"],
        order: { purchaseDate: "DESC" },
      });

      const summary = {
        total: tickets.length,
        confirmed: tickets.filter((t) => t.status === "confirmed").length,
        pending: tickets.filter((t) => t.status === "pending").length,
        used: tickets.filter((t) => t.status === "used").length,
        revoked: tickets.filter((t) => t.status === "revoked").length,
      };

      res.json({
        message: "Event tickets retrieved successfully",
        status: "success",
        data: {
          summary,
          tickets: tickets.map((ticket) => ({
            ticketID: ticket.ticketID,
            ticketNumber: ticket.ticketNumber,
            status: ticket.status,
            purchaseDate: ticket.purchaseDate,
            usedAt: ticket.usedAt,
            revokedAt: ticket.revokedAt,
            revokedReason: ticket.revokedReason,
            user: {
              userID: ticket.user.userID,
              fullName: ticket.user.fullName,
              email: ticket.user.email,
            },
          })),
        },
      });
    } catch (error) {
      console.error("Error fetching event tickets:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // Approve/Reject ticket (for events requiring approval)
  static async approveTicket(req, res) {
    try {
      const { ticketID } = req.params;
      const { action } = req.body; // "approve" or "reject"
      const ticketRepository = AppDataSource.getRepository("Ticket");

      const ticket = await ticketRepository.findOne({
        where: { ticketID },
        relations: ["event", "user"],
      });

      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      if (ticket.status !== "pending") {
        return res
          .status(400)
          .json({ message: "Ticket is not pending approval" });
      }

      if (action === "approve") {
        ticket.status = "confirmed";

        // Generate PDF
        const pdfUrl = await TicketController.generateTicketPDF(
          ticket,
          ticket.event,
          ticket.user
        );
        ticket.pdfUrl = pdfUrl;

        await ticketRepository.save(ticket);

        res.json({
          message: "Ticket approved successfully",
          ticketNumber: ticket.ticketNumber,
          pdfUrl: ticket.pdfUrl,
        });
      } else if (action === "reject") {
        ticket.status = "cancelled";
        await ticketRepository.save(ticket);

        res.json({
          message: "Ticket rejected",
          ticketNumber: ticket.ticketNumber,
        });
      } else {
        res.status(400).json({ message: "Invalid action" });
      }
    } catch (error) {
      console.error("Error processing ticket approval:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // Auto-generate confirmed ticket (for event joins)
  static async autoGenerateTicket(req, res) {
    try {
      const { eventID } = req.params;
      const userID = req.user.userID;

      const eventRepository = AppDataSource.getRepository("Event");
      const ticketRepository = AppDataSource.getRepository("Ticket");
      const userRepository = AppDataSource.getRepository("User");

      // Get event details
      const event = await eventRepository.findOne({
        where: { eventID },
        relations: ["tickets"],
      });

      if (!event || !event.ticketingEnabled) {
        return res.status(400).json({
          message: "Ticketing is not enabled for this event",
        });
      }

      // Check if user already has a ticket for this event
      const existingTicket = await ticketRepository.findOne({
        where: {
          event: { eventID },
          user: { userID },
          status: In(["confirmed", "pending", "used"]),
        },
      });

      if (existingTicket) {
        return res.status(200).json({
          message: "User already has a ticket for this event",
          ticket: {
            ticketID: existingTicket.ticketID,
            ticketNumber: existingTicket.ticketNumber,
            status: existingTicket.status,
            pdfUrl: existingTicket.pdfUrl,
          },
        });
      }

      const user = await userRepository.findOne({ where: { userID } });

      // Create single confirmed ticket (always confirmed for event joins)
      const ticketNumber = await TicketController.generateTicketNumber();
      const qrCode = await TicketController.generateQRCode(ticketNumber);

      const ticket = ticketRepository.create({
        ticketNumber,
        qrCode,
        status: "confirmed", // Always confirmed when joining event directly
        event,
        user,
      });

      const savedTicket = await ticketRepository.save(ticket);

      // Generate PDF
      const pdfUrl = await TicketController.generateTicketPDF(
        savedTicket,
        event,
        user
      );
      savedTicket.pdfUrl = pdfUrl;
      await ticketRepository.save(savedTicket);

      res.status(201).json({
        message: "Ticket auto-generated successfully",
        ticket: {
          ticketID: savedTicket.ticketID,
          ticketNumber: savedTicket.ticketNumber,
          status: savedTicket.status,
          pdfUrl: savedTicket.pdfUrl,
        },
      });
    } catch (error) {
      console.error("Error auto-generating ticket:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  // Helper methods
  static async generateTicketNumber() {
    return `TKT-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)
      .toUpperCase()}`;
  }

  static async generateQRCode(ticketNumber) {
    try {
      const qrCodeData = JSON.stringify({
        ticketNumber,
        timestamp: Date.now(),
        type: "gatherup_ticket",
      });

      return await QRCode.toDataURL(qrCodeData);
    } catch (error) {
      console.error("Error generating QR code:", error);
      throw error;
    }
  }

  static async generateTicketPDF(ticket, event, user) {
    try {
      const fileName = `ticket-${ticket.ticketNumber}.pdf`;
      const filePath = path.join(__dirname, "../public/tickets", fileName);

      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Read the HTML template
      const templatePath = path.join(
        __dirname,
        "../templates/ticketTemplate.html"
      );
      let htmlContent = fs.readFileSync(templatePath, "utf8");

      // Format date and time
      const eventDate = new Date(event.eventDate);
      const formattedDate = eventDate.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const formattedTime = eventDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });

      // Replace template variables
      htmlContent = htmlContent
        .replace(/{{eventName}}/g, event.name)
        .replace(/{{eventDate}}/g, formattedDate)
        .replace(/{{eventTime}}/g, formattedTime)
        .replace(/{{location}}/g, event.location)
        .replace(/{{attendeeName}}/g, user.fullName)
        .replace(/{{attendeeEmail}}/g, user.email)
        .replace(/{{ticketNumber}}/g, ticket.ticketNumber)
        .replace(/{{qrCodeData}}/g, ticket.qrCode);

      // Launch puppeteer
      const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: "networkidle0" });

      // Generate PDF
      await page.pdf({
        path: filePath,
        format: "A4",
        printBackground: true,
        margin: {
          top: "0px",
          right: "0px",
          bottom: "0px",
          left: "0px",
        },
        preferCSSPageSize: true,
      });

      await browser.close();

      return `/tickets/${fileName}`;
    } catch (error) {
      console.error("Error generating PDF:", error);
      throw error;
    }
  }
}

module.exports = TicketController;
