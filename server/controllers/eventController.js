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
    const { keyword, category, date, location } = req.query;

    const conditions = [`e.approval_status = 'approved'`];
    const values = [];
    let paramIndex = 1;

    if (keyword) {
      conditions.push(`(
        e.title ILIKE $${paramIndex}
        OR e.event_description ILIKE $${paramIndex}
      )`);
      values.push(`%${keyword}%`);
      paramIndex++;
    }

    if (category) {
      conditions.push(`e.category ILIKE $${paramIndex}`);
      values.push(`%${category}%`);
      paramIndex++;
    }

    if (date) {
      conditions.push(`e.event_date = $${paramIndex}`);
      values.push(date);
      paramIndex++;
    }

    if (location) {
      conditions.push(`(
        e.location_name ILIKE $${paramIndex}
        OR e.location_address ILIKE $${paramIndex}
        OR e.location_city ILIKE $${paramIndex}
        OR e.location_state ILIKE $${paramIndex}
        OR e.location_zip_code ILIKE $${paramIndex}
      )`);
      values.push(`%${location}%`);
      paramIndex++;
    }

    const query = `
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
        u.full_name AS organizer_name,
        u.email AS organizer_email,
        COUNT(r.id) FILTER (WHERE r.registration_status = 'registered')::INT AS active_registration_count,
        (e.capacity - COUNT(r.id) FILTER (WHERE r.registration_status = 'registered'))::INT AS remaining_capacity,
        (
          (e.capacity - COUNT(r.id) FILTER (WHERE r.registration_status = 'registered')) <= 0
        )::BOOLEAN AS is_full,
        (
          e.approval_status = 'approved'
          AND
          (e.capacity - COUNT(r.id) FILTER (WHERE r.registration_status = 'registered')) > 0
        )::BOOLEAN AS can_register,
        CONCAT_WS(
          ', ',
          e.location_name,
          e.location_address,
          e.location_city,
          e.location_state,
          e.location_zip_code
        ) AS full_location
      FROM events e
      JOIN users u
        ON e.organizer_id = u.id
      LEFT JOIN registrations r
        ON e.id = r.event_id
      WHERE ${conditions.join(" AND ")}
      GROUP BY e.id, u.id
      ORDER BY e.event_date ASC, e.start_time ASC
    `;

    const result = await pool.query(query, values);

    return successResponse(res, result.rows, "Events fetched successfully");
  } catch (error) {
    return next(error);
  }
}

async function getEventById(req, res, next) {
  try {
    const { id } = req.params;

    if (!Number.isInteger(Number(id))) {
      return errorResponse(res, 400, "Invalid event id");
    }

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
        u.full_name AS organizer_name,
        u.email AS organizer_email,
        COUNT(r.id) FILTER (WHERE r.registration_status = 'registered')::INT AS active_registration_count,
        (e.capacity - COUNT(r.id) FILTER (WHERE r.registration_status = 'registered'))::INT AS remaining_capacity,
        (
          (e.capacity - COUNT(r.id) FILTER (WHERE r.registration_status = 'registered')) <= 0
        )::BOOLEAN AS is_full,
        (
          e.approval_status = 'approved'
          AND
          (e.capacity - COUNT(r.id) FILTER (WHERE r.registration_status = 'registered')) > 0
        )::BOOLEAN AS can_register,
        CONCAT_WS(
          ', ',
          e.location_name,
          e.location_address,
          e.location_city,
          e.location_state,
          e.location_zip_code
        ) AS full_location
      FROM events e
      JOIN users u
        ON e.organizer_id = u.id
      LEFT JOIN registrations r
        ON e.id = r.event_id
      WHERE e.id = $1 AND e.approval_status = 'approved'
      GROUP BY e.id, u.id
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
        longitude ?? event.longitude,
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

module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
};