const pool = require("../config/db");
const { successResponse, errorResponse } = require("../utils/responseHandler");

const isValidEventDate = (eventDate) => {
  if (typeof eventDate !== "string") {
    return false;
  }

  const trimmedDate = eventDate.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmedDate)) {
    return false;
  }

  const parsedDate = new Date(trimmedDate);
  return !Number.isNaN(parsedDate.getTime());
};

const isValidStartTime = (startTime) => {
  if (typeof startTime !== "string") {
    return false;
  }

  return /^([01]\d|2[0-3]):[0-5]\d$/.test(startTime.trim());
};

const isValidCapacity = (capacity) => {
  const numericCapacity = Number(capacity);
  return Number.isFinite(numericCapacity) && numericCapacity > 0;
};

function canManageEvents(user) {
  return user && (user.role === "organizer" || user.role === "admin");
}

async function getAllEvents(req, res, next) {
  try {
    const result = await pool.query(
      `
      SELECT
        id,
        organizer_id,
        title,
        event_description,
        category,
        event_date,
        start_time,
        end_time,
        location_name,
        location_address,
        location_city,
        location_state,
        location_zip_code,
        latitude,
        longitude,
        capacity,
        approval_status,
        is_free,
        ticket_price,
        schedule_notes,
        calendar_link,
        created_at,
        updated_at
      FROM events
      WHERE approval_status = 'approved'
      ORDER BY event_date ASC, start_time ASC
      `
    );

    return successResponse(res, result.rows, "Events fetched successfully");
  } catch (error) {
    return next(error);
  }
}

async function getEventById(req, res, next) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        e.id,
        e.organizer_id,
        e.title,
        e.event_description,
        e.category,
        e.event_date,
        e.start_time,
        e.end_time,
        e.location_name,
        e.location_address,
        e.location_city,
        e.location_state,
        e.location_zip_code,
        e.latitude,
        e.longitude,
        e.capacity,
        e.approval_status,
        e.is_free,
        e.ticket_price,
        e.schedule_notes,
        e.calendar_link,
        e.created_at,
        e.updated_at,
        (
          SELECT COUNT(*)::int
          FROM registrations r
          WHERE r.event_id = e.id AND r.registration_status = 'registered'
        ) AS registered_count,
        u.full_name AS organizer_full_name
      FROM events e
      LEFT JOIN users u ON u.id = e.organizer_id
      WHERE e.id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 404, "Event not found");
    }

    return successResponse(res, result.rows[0], "Event fetched successfully");
  } catch (error) {
    return next(error);
  }
}

async function createEvent(req, res, next) {
  try {
    if (!canManageEvents(req.user)) {
      return errorResponse(res, 403, "Only organizers or admins can create events");
    }

    const {
      title,
      event_description,
      category,
      event_date,
      start_time,
      end_time,
      location_name,
      location_address,
      location_city,
      location_state,
      location_zip_code,
      latitude,
      longitude,
      capacity,
      is_free = true,
      ticket_price = 0,
      schedule_notes,
      calendar_link,
    } = req.body;

    if (!title || !event_description || !event_date || !start_time || !capacity) {
      return errorResponse(
        res,
        400,
        "title, event_description, event_date, start_time, and capacity are required"
      );
    }

    if (!isValidEventDate(event_date)) {
      return errorResponse(res, 400, "Invalid event_date format");
    }

    if (!isValidStartTime(start_time)) {
      return errorResponse(res, 400, "Invalid start_time format");
    }

    if (!isValidCapacity(capacity)) {
      return errorResponse(res, 400, "capacity must be a number greater than 0");
    }

    if (Boolean(is_free) && Number(ticket_price) !== 0) {
      return errorResponse(res, 400, "Free events must have ticket_price = 0");
    }

    const result = await pool.query(
      `
      INSERT INTO events (
        organizer_id,
        title,
        event_description,
        category,
        event_date,
        start_time,
        end_time,
        location_name,
        location_address,
        location_city,
        location_state,
        location_zip_code,
        latitude,
        longitude,
        capacity,
        approval_status,
        is_free,
        ticket_price,
        schedule_notes,
        calendar_link
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, 'pending', $16, $17, $18, $19
      )
      RETURNING *
      `,
      [
        req.user.userId,
        title,
        event_description,
        category || null,
        event_date,
        start_time,
        end_time || null,
        location_name || null,
        location_address || null,
        location_city || null,
        location_state || null,
        location_zip_code || null,
        latitude ?? null,
        longitude ?? null,
        Number(capacity),
        Boolean(is_free),
        Number(ticket_price),
        schedule_notes || null,
        calendar_link || null,
      ]
    );

    return successResponse(res, result.rows[0], "Event created successfully", 201);
  } catch (error) {
    return next(error);
  }
}

async function updateEvent(req, res, next) {
  try {
    if (!canManageEvents(req.user)) {
      return errorResponse(res, 403, "Only organizers or admins can update events");
    }

    if (!req.body || Object.keys(req.body).length === 0) {
      return errorResponse(res, 400, "At least one field is required for update");
    }

    const { id } = req.params;
    const {
      title,
      event_description,
      category,
      event_date,
      start_time,
      end_time,
      location_name,
      location_address,
      location_city,
      location_state,
      location_zip_code,
      latitude,
      longitude,
      capacity,
      is_free,
      ticket_price,
      schedule_notes,
      calendar_link,
    } = req.body;

    if (event_date !== undefined && !isValidEventDate(event_date)) {
      return errorResponse(res, 400, "Invalid event_date format");
    }

    if (start_time !== undefined && !isValidStartTime(start_time)) {
      return errorResponse(res, 400, "Invalid start_time format");
    }

    if (capacity !== undefined && !isValidCapacity(capacity)) {
      return errorResponse(res, 400, "capacity must be a number greater than 0");
    }

    const existingEvent = await pool.query(`SELECT * FROM events WHERE id = $1`, [id]);
    if (existingEvent.rows.length === 0) {
      return errorResponse(res, 404, "Event not found");
    }

    const event = existingEvent.rows[0];
    if (req.user.role !== "admin" && Number(event.organizer_id) !== Number(req.user.userId)) {
      return errorResponse(res, 403, "You can only update your own events");
    }

    const updatedIsFree = typeof is_free === "boolean" ? is_free : event.is_free;
    const updatedTicketPrice = ticket_price !== undefined ? Number(ticket_price) : Number(event.ticket_price);
    const updatedCapacity = capacity !== undefined ? Number(capacity) : Number(event.capacity);

    if (updatedIsFree && updatedTicketPrice !== 0) {
      return errorResponse(res, 400, "Free events must have ticket_price = 0");
    }

    const result = await pool.query(
      `
      UPDATE events
      SET
        title = $1,
        event_description = $2,
        category = $3,
        event_date = $4,
        start_time = $5,
        end_time = $6,
        location_name = $7,
        location_address = $8,
        location_city = $9,
        location_state = $10,
        location_zip_code = $11,
        latitude = $12,
        longitude = $13,
        capacity = $14,
        is_free = $15,
        ticket_price = $16,
        schedule_notes = $17,
        calendar_link = $18,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $19
      RETURNING *
      `,
      [
        title ?? event.title,
        event_description ?? event.event_description,
        category ?? event.category,
        event_date ?? event.event_date,
        start_time ?? event.start_time,
        end_time ?? event.end_time,
        location_name ?? event.location_name,
        location_address ?? event.location_address,
        location_city ?? event.location_city,
        location_state ?? event.location_state,
        location_zip_code ?? event.location_zip_code,
        latitude ?? event.latitude,
        longitude ?? event.longitutde,
        updatedCapacity,
        updatedIsFree,
        updatedTicketPrice,
        schedule_notes ?? event.schedule_notes,
        calendar_link ?? event.calendar_link,
        id,
      ]
    );

    return successResponse(res, result.rows[0], "Event updated successfully");
  } catch (error) {
    return next(error);
  }
}

async function deleteEvent(req, res, next) {
  try {
    if (!canManageEvents(req.user)) {
      return errorResponse(res, 403, "Only organizers or admins can delete events");
    }

    const { id } = req.params;
    const existingEvent = await pool.query(`SELECT * FROM events WHERE id = $1`, [id]);
    if (existingEvent.rows.length === 0) {
      return errorResponse(res, 404, "Event not found");
    }

    const event = existingEvent.rows[0];
    if (req.user.role !== "admin" && Number(event.organizer_id) !== Number(req.user.userId)) {
      return errorResponse(res, 403, "You can only delete your own events");
    }

    await pool.query(`DELETE FROM events WHERE id = $1`, [id]);
    return successResponse(res, null, "Event deleted successfully");
  } catch (error) {
    return next(error);
  }
}

async function registerForEvent(req, res, next) {
  try {
    const { id: eventId } = req.params;
    const userId = req.user.userId;

    const eventResult = await pool.query(`SELECT id, capacity FROM events WHERE id = $1`, [eventId]);
    if (eventResult.rows.length === 0) {
      return errorResponse(res, 404, "Event not found");
    }

    const existingRegistration = await pool.query(
      `SELECT id, registration_status FROM registrations WHERE user_id = $1 AND event_id = $2`,
      [userId, eventId]
    );

    const existingRow = existingRegistration.rows[0];

    const activeRegistrationCountResult = await pool.query(
      `
      SELECT COUNT(*) AS active_count
      FROM registrations
      WHERE event_id = $1 AND registration_status = 'registered'
      `,
      [eventId]
    );

    const activeRegistrationCount = Number(activeRegistrationCountResult.rows[0].active_count);
    const eventCapacity = Number(eventResult.rows[0].capacity);

    if (existingRow && existingRow.registration_status === "registered") {
      return errorResponse(res, 409, "User is already registered for this event");
    }

    if (activeRegistrationCount >= eventCapacity) {
      return errorResponse(res, 400, "Event capacity has been reached");
    }

    if (existingRow) {
      const revivedResult = await pool.query(
        `
        UPDATE registrations
        SET
          registration_status = 'registered',
          cancelled_at = NULL,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1 AND event_id = $2
        RETURNING *
        `,
        [userId, eventId]
      );

      return successResponse(res, revivedResult.rows[0], "RSVP registration successful", 200);
    }

    const registrationResult = await pool.query(
      `
      INSERT INTO registrations (user_id, event_id)
      VALUES ($1, $2)
      RETURNING *
      `,
      [userId, eventId]
    );

    return successResponse(
      res,
      registrationResult.rows[0],
      "RSVP registration successful",
      201
    );
  } catch (error) {
    return next(error);
  }
}

async function getMyRsvpStatus(req, res, next) {
  try {
    const { id: eventId } = req.params;
    const userId = req.user.userId;

    const eventExists = await pool.query(`SELECT id FROM events WHERE id = $1`, [eventId]);
    if (eventExists.rows.length === 0) {
      return errorResponse(res, 404, "Event not found");
    }

    const registration = await pool.query(
      `
      SELECT id
      FROM registrations
      WHERE user_id = $1 AND event_id = $2 AND registration_status = 'registered'
      `,
      [userId, eventId]
    );

    const registered = registration.rows.length > 0;
    return successResponse(res, { registered }, "RSVP status fetched successfully");
  } catch (error) {
    return next(error);
  }
}

async function unregisterFromEvent(req, res, next) {
  try {
    const { id: eventId } = req.params;
    const userId = req.user.userId;

    const result = await pool.query(
      `
      UPDATE registrations
      SET
        registration_status = 'cancelled',
        cancelled_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND event_id = $2 AND registration_status = 'registered'
      RETURNING id
      `,
      [userId, eventId]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 404, "No active registration found for this event");
    }

    return successResponse(res, null, "Unregistered successfully");
  } catch (error) {
    return next(error);
  }
}

async function approveEvent(req, res, next) {
  try {
    const { id } = req.params;

    const existing = await pool.query(`SELECT id FROM events WHERE id = $1`, [id]);
    if (existing.rows.length === 0) {
      return errorResponse(res, 404, "Event not found");
    }

    const result = await pool.query(
      `
      UPDATE events
      SET approval_status = 'approved', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    return successResponse(res, result.rows[0], "Event approved successfully");
  } catch (error) {
    return next(error);
  }
}

async function rejectEvent(req, res, next) {
  try {
    const { id } = req.params;

    const existing = await pool.query(`SELECT id FROM events WHERE id = $1`, [id]);
    if (existing.rows.length === 0) {
      return errorResponse(res, 404, "Event not found");
    }

    const result = await pool.query(
      `
      UPDATE events
      SET approval_status = 'rejected', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    return successResponse(res, result.rows[0], "Event rejected successfully");
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  getMyRsvpStatus,
  unregisterFromEvent,
  approveEvent,
  rejectEvent,
};