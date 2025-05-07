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

app.use("/", indexRouter);
app.use("/user", userRouter);
app.use("/events", eventsRouter);

// Error handling
app.use((err, req, res, next) => {
  res.status(500).json({ error: "Internal Server Error" });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;
