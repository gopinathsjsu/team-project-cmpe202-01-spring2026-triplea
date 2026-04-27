// Express routes for event-related endpoints.

// simple event route test
const express = require("express");
const router = express.Router();
const { getAllEvents, createEvent, updateEvent } = require("../controllers/eventController");
const { authenticateToken } = require("../middleware/authMiddleware");

router.get("/", getAllEvents);
router.post("/", authenticateToken, createEvent);
router.put("/:id", authenticateToken, updateEvent);

module.exports = router;