// Express routes for event-related endpoints.

// simple event route test
const express = require("express");
const router = express.Router();
const { getAllEvents, createEvent, updateEvent } = require("../controllers/eventController");

router.get("/", getAllEvents);
router.post("/", createEvent);
router.put("/:id", updateEvent);

module.exports = router;