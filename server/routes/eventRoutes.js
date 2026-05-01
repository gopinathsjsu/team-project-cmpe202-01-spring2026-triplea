// Express routes for event-related endpoints.

const express = require("express");
const router = express.Router();

const { authenticateToken } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/authorizeRole");
const {
  getAllEvents,
  getMyEvents,
  getMyRegisteredEvents,
  getPendingEvents,
  getAllEventsForAdmin,
  getEventAttendees,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  getMyRsvpStatus,
  unregisterFromEvent,
  approveEvent,
  rejectEvent,
} = require("../controllers/eventController");

router.get("/", getAllEvents);
router.get("/my-events", authenticateToken, authorizeRoles("organizer"), getMyEvents);
router.get("/my-registrations", authenticateToken, authorizeRoles("attendee"), getMyRegisteredEvents);
router.get("/pending", authenticateToken, authorizeRoles("admin"), getPendingEvents);
router.get("/all", authenticateToken, authorizeRoles("admin"), getAllEventsForAdmin);
router.get("/:id/attendees", authenticateToken, authorizeRoles("organizer", "admin"), getEventAttendees);
router.get("/:id/rsvp-status", authenticateToken, authorizeRoles("attendee"), getMyRsvpStatus);
router.get("/:id", getEventById);
router.post("/", authenticateToken, authorizeRoles("organizer", "admin"), createEvent);
router.post("/:id/rsvp", authenticateToken, authorizeRoles("attendee"), registerForEvent);
router.delete("/:id/rsvp", authenticateToken, authorizeRoles("attendee"), unregisterFromEvent);
router.put("/:id/approve", authenticateToken, authorizeRoles("admin"), approveEvent);
router.put("/:id/reject", authenticateToken, authorizeRoles("admin"), rejectEvent);
router.put("/:id", authenticateToken, authorizeRoles("organizer", "admin"), updateEvent);
router.delete("/:id", authenticateToken, authorizeRoles("organizer", "admin"), deleteEvent);

module.exports = router;