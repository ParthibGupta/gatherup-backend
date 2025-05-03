const express = require("express");
const router = express.Router();

router.get("/", function (req, res, next) {
  res.json({
    title: "Users API",
    description: "This is the users API endpoint.",
  });
});

module.exports = router;
