const express = require("express");
const cors = require("cors");
const path = require("path");
const AppDataSource = require("./config/database");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//Initialize DB connection
AppDataSource.initialize()
  .then(() => {
    console.log("Database connected and tables created successfully!");
  })
  .catch((err) => {
    console.error("Error during database initialization:", err);
  });

// Routes
const indexRouter = require("./routes/index");
const userRouter = require("./routes/user");
const eventsRouter = require("./routes/events");
const invitesRouter = require("./routes/invites");
const notificationsRouter = require("./routes/notifications");
const waitlistRouter = require("./routes/waitlists");
const emailRouter = require("./routes/email");
const aiRouter = require("./routes/ai");
const ticketsRouter = require("./routes/tickets");
const templatesRouter = require("./routes/templates");
const e = require("express");

// Static files
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/user", userRouter);
app.use("/events", eventsRouter);
app.use("/ai", aiRouter);
app.use("/email", emailRouter);
app.use("/tickets", ticketsRouter);
app.use("/templates", templatesRouter);

// Error handling
app.use((err, req, res, next) => {
  res.status(500).json({ error: "Internal Server Error" });
});

const port = process.env.PORT || 8081;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app;
