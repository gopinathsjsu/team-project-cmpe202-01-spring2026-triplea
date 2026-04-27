// Controller for handling event request logic.
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

const pool = require("../config/db");
const { successResponse, errorResponse } = require("../utils/responseHandler");

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
      WHERE id = $1
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

    if (Number(capacity) <= 0) {
      return errorResponse(res, 400, "capacity must be greater than 0");
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

    const existingEvent = await pool.query(
      `SELECT * FROM events WHERE id = $1`,
      [id]
    );

    if (existingEvent.rows.length === 0) {
      return errorResponse(res, 404, "Event not found");
    }

    const event = existingEvent.rows[0];

    if (
      req.user.role !== "admin" &&
      Number(event.organizer_id) !== Number(req.user.userId)
    ) {
      return errorResponse(res, 403, "You can only update your own events");
    }

    const updatedIsFree =
      typeof is_free === "boolean" ? is_free : event.is_free;

    const updatedTicketPrice =
      ticket_price !== undefined ? Number(ticket_price) : Number(event.ticket_price);

    const updatedCapacity =
      capacity !== undefined ? Number(capacity) : Number(event.capacity);

    if (updatedCapacity <= 0) {
      return errorResponse(res, 400, "capacity must be greater than 0");
    }

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

    const existingEvent = await pool.query(
      `SELECT * FROM events WHERE id = $1`,
      [id]
    );

    if (existingEvent.rows.length === 0) {
      return errorResponse(res, 404, "Event not found");
    }

    const event = existingEvent.rows[0];

    if (
      req.user.role !== "admin" &&
      Number(event.organizer_id) !== Number(req.user.userId)
    ) {
      return errorResponse(res, 403, "You can only delete your own events");
    }

    await pool.query(`DELETE FROM events WHERE id = $1`, [id]);

    return successResponse(res, null, "Event deleted successfully");
// simple event controller endpoint test
const getAllEvents = async (req, res, next) => {
  try {
    return successResponse(res, [], "Events endpoint is working");
  } catch (error) {
    return next(error);
  }
};

const createEvent = async (req, res, next) => {
  try {
    const { title, description, event_date, start_time, capacity } = req.body;

    if (!title || !description || !event_date || !start_time || !capacity) {
      return errorResponse(
        res,
        400,
        "title, description, event_date, start_time, and capacity are required"
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

    return successResponse(res, req.body, "Event created successfully", 201);
  } catch (error) {
    return next(error);
  }
};

const updateEvent = async (req, res, next) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return errorResponse(res, 400, "At least one field is required for update");
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "event_date") && !isValidEventDate(req.body.event_date)) {
      return errorResponse(res, 400, "Invalid event_date format");
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "start_time") && !isValidStartTime(req.body.start_time)) {
      return errorResponse(res, 400, "Invalid start_time format");
    }

    if (Object.prototype.hasOwnProperty.call(req.body, "capacity") && !isValidCapacity(req.body.capacity)) {
      return errorResponse(res, 400, "capacity must be a number greater than 0");
    }

    return successResponse(res, req.body, "Event updated successfully");
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
};