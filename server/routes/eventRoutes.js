// Express routes for event-related endpoints.

// simple event route test
const express = require("express");
const router = express.Router();
const { getAllEvents, createEvent, updateEvent } = require("../controllers/eventController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authorizeRole");

router.get("/", getAllEvents);
router.post("/", authenticateToken, authorizeRoles("organizer", "admin"), createEvent);
router.put("/:id", authenticateToken, authorizeRoles("organizer", "admin"), updateEvent);

module.exports = router;