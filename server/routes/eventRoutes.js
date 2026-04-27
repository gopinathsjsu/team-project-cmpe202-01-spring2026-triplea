// Express routes for event-related endpoints.

const express = require("express");
const router = express.Router();

const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authorizeRole");
const {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} = require("../controllers/eventController");

router.get("/", getAllEvents);
router.get("/:id", getEventById);
router.post("/", authenticateToken, authorizeRoles("organizer", "admin"), createEvent);
router.put("/:id", authenticateToken, authorizeRoles("organizer", "admin"), updateEvent);
router.delete("/:id", authenticateToken, authorizeRoles("organizer", "admin"), deleteEvent);

module.exports = router;