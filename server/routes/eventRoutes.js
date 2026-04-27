// Express routes for event-related endpoints.

const express = require("express");
const router = express.Router();

const { authenticateToken } = require("../middleware/authMiddleware");
const {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} = require("../controllers/eventController");

router.get("/", getAllEvents);
router.get("/:id", getEventById);
router.post("/", authenticateToken, createEvent);
router.put("/:id", authenticateToken, updateEvent);
router.delete("/:id", authenticateToken, deleteEvent);
const { getAllEvents, createEvent, updateEvent } = require("../controllers/eventController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authorizeRole");

router.get("/", getAllEvents);
router.post("/", authenticateToken, authorizeRoles("organizer", "admin"), createEvent);
router.put("/:id", authenticateToken, authorizeRoles("organizer", "admin"), updateEvent);

module.exports = router;