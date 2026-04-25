// Express routes for event-related endpoints.

// simple event route test
const express = require("express");
const router = express.Router();
const { getAllEvents } = require("../controllers/eventController");

router.get("/", getAllEvents);

module.exports = router;