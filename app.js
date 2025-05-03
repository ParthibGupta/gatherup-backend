const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
const indexRouter = require("./routes/index");
const usersRouter = require("./routes/users");
const eventsRouter = require("./routes/events");
const invitesRouter = require("./routes/invites");
const notificationsRouter = require("./routes/notifications");
const waitlistRouter = require("./routes/waitlists");

app.use("/", indexRouter);
app.use("/users", usersRouter);

// Error handling
app.use((err, req, res, next) => {
  res.status(500).json({ error: "Internal Server Error" });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app;
