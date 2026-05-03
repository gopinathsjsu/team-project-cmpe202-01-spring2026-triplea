// Express routes for event-related endpoints.

const express = require("express");
const router = express.Router();

const { authenticateToken, authenticateTokenOptional } = require("../middleware/authMiddleware");
const { validateEventIdParam } = require("../middleware/validateEventIdParam");
const { authorizeRoles } = require("../middleware/authorizeRole");
const {
  getEventCategories,
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

router.get("/", authenticateTokenOptional, getAllEvents);
router.get("/my-events", authenticateToken, authorizeRoles("organizer"), getMyEvents);
router.get("/my-registrations", authenticateToken, authorizeRoles("attendee"), getMyRegisteredEvents);
router.get("/pending", authenticateToken, authorizeRoles("admin"), getPendingEvents);
router.get("/all", authenticateToken, authorizeRoles("admin"), getAllEventsForAdmin);
router.get("/categories", authenticateTokenOptional, getEventCategories);
router.get(
  "/:id/attendees",
  authenticateToken,
  authorizeRoles("organizer", "admin"),
  validateEventIdParam,
  getEventAttendees
);
router.get("/:id/rsvp-status", authenticateToken, authorizeRoles("attendee"), validateEventIdParam, getMyRsvpStatus);
router.get("/:id", authenticateTokenOptional, validateEventIdParam, getEventById);
router.post("/", authenticateToken, authorizeRoles("organizer", "admin"), createEvent);
router.post("/:id/rsvp", authenticateToken, authorizeRoles("attendee"), validateEventIdParam, registerForEvent);
router.delete("/:id/rsvp", authenticateToken, authorizeRoles("attendee"), validateEventIdParam, unregisterFromEvent);
router.put("/:id/approve", authenticateToken, authorizeRoles("admin"), validateEventIdParam, approveEvent);
router.put("/:id/reject", authenticateToken, authorizeRoles("admin"), validateEventIdParam, rejectEvent);
router.put("/:id", authenticateToken, authorizeRoles("organizer", "admin"), validateEventIdParam, updateEvent);
router.delete("/:id", authenticateToken, authorizeRoles("organizer", "admin"), validateEventIdParam, deleteEvent);

module.exports = router;