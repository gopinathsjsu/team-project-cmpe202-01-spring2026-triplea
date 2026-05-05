const pool = require("../config/db");
const { successResponse, errorResponse } = require("../utils/responseHandler");
const {
  isNonEmptyTrimmedString,
  normalizeCategoryLabel,
} = require("../utils/validation");
const {
  notifyRegistrationConfirmation,
  notifyEventApprovalStatus,
  notifyRegistrationCancelled,
  notifyEventDeleted,
} = require("../utils/notificationService");
const { generateGoogleCalendarLink, generateGoogleMapsSearchLink } = require("../utils/calendarUtils");

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

const MAX_REJECTION_REASON_LENGTH = 2000;

/** Public events list — ORDER BY fragments (sort query param must match keys only). */
const EVENT_LIST_SORT_SQL = {
  date_asc: "e.event_date ASC, e.start_time ASC",
  date_desc: "e.event_date DESC, e.start_time DESC",
  title_asc: "LOWER(e.title) ASC NULLS LAST, e.event_date ASC, e.start_time ASC",
  title_desc: "LOWER(e.title) DESC NULLS LAST, e.event_date ASC, e.start_time ASC",
};

function canManageEvents(user) {
  return user && (user.role === "organizer" || user.role === "admin");
}

/** True when the client explicitly asks for a paid / non-free event (reject with 400). */
function bodyRequestsPaidEvent(body) {
  if (!body || typeof body !== "object") {
    return false;
  }
  if (Object.prototype.hasOwnProperty.call(body, "is_free")) {
    const v = body.is_free;
    if (v === false || v === "false" || v === 0 || v === "0") {
      return true;
    }
  }
  if (Object.prototype.hasOwnProperty.call(body, "ticket_price")) {
    const p = Number(body.ticket_price);
    if (Number.isFinite(p) && p > 0) {
      return true;
    }
  }
  return false;
}

function hasOwn(body, key) {
  return Object.prototype.hasOwnProperty.call(body, key);
}

function buildEventUpdatePayload(body, event) {
  const resolvedEndTime = hasOwn(body, "end_time")
    ? typeof body.end_time === "string"
      ? body.end_time.trim()
      : ""
    : event.end_time;

  const updatedCapacity = hasOwn(body, "capacity")
    ? Number(body.capacity)
    : Number(event.capacity);

  return {
    title: hasOwn(body, "title") ? String(body.title).trim() : event.title,
    event_description: hasOwn(body, "event_description")
      ? String(body.event_description).trim()
      : event.event_description,
    category: hasOwn(body, "category")
      ? normalizeCategoryLabel(typeof body.category === "string" ? body.category : "")
      : event.category,
    event_date: body.event_date ?? event.event_date,
    start_time: body.start_time ?? event.start_time,
    end_time: resolvedEndTime,
    location_name: body.location_name ?? event.location_name,
    location_address: body.location_address ?? event.location_address,
    location_city: body.location_city ?? event.location_city,
    location_state: body.location_state ?? event.location_state,
    location_zip_code: body.location_zip_code ?? event.location_zip_code,
    latitude: body.latitude ?? event.latitude,
    longitude: body.longitude ?? event.longitude,
    capacity: updatedCapacity,
    is_free: true,
    ticket_price: 0,
    schedule_notes: body.schedule_notes ?? event.schedule_notes,
    calendar_link: body.calendar_link ?? event.calendar_link,
  };
}

function eventUpdateValues(payload) {
  return [
    payload.title,
    payload.event_description,
    payload.category,
    payload.event_date,
    payload.start_time,
    payload.end_time,
    payload.location_name,
    payload.location_address,
    payload.location_city,
    payload.location_state,
    payload.location_zip_code,
    payload.latitude,
    payload.longitude,
    payload.capacity,
    true,
    0,
    payload.schedule_notes,
    payload.calendar_link,
  ];
}

async function getEventCategories(req, res, next) {
  try {
    const result = await pool.query(
      `
      SELECT DISTINCT BTRIM(category) AS category
      FROM events
      WHERE category IS NOT NULL AND BTRIM(category) <> ''
      ORDER BY 1 ASC
      `
    );
    const categories = result.rows.map((row) => row.category).filter(Boolean);
    return successResponse(res, categories, "Categories fetched successfully");
  } catch (error) {
    return next(error);
  }
}

async function getAllEvents(req, res, next) {
  try {
    const { keyword, category, date_from, date_to, location } = req.query;

    const viewer = req.user && typeof req.user === "object" ? req.user : null;
    const conditions = [];
    const values = [];
    let paramIndex = 1;

    if (!viewer || typeof viewer.role !== "string") {
      conditions.push(`e.approval_status = 'approved'`);
    } else if (viewer.role === "admin") {
      /* all events — no approval filter */
    } else if (viewer.role === "organizer") {
      conditions.push(`(e.approval_status = 'approved' OR e.organizer_id = $${paramIndex})`);
      values.push(viewer.userId);
      paramIndex++;
    } else {
      conditions.push(`e.approval_status = 'approved'`);
    }

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

    const dateFromStr =
      date_from !== undefined && date_from !== null ? String(date_from).trim() : "";
    const dateToStr = date_to !== undefined && date_to !== null ? String(date_to).trim() : "";

    if (dateFromStr !== "" && !isValidEventDate(dateFromStr)) {
      return errorResponse(res, 400, "Invalid date filter format");
    }
    if (dateToStr !== "" && !isValidEventDate(dateToStr)) {
      return errorResponse(res, 400, "Invalid date filter format");
    }
    if (dateFromStr !== "" && dateToStr !== "" && dateFromStr > dateToStr) {
      return errorResponse(res, 400, "Invalid date range: start must be on or before end");
    }
    if (dateFromStr !== "" && dateToStr !== "") {
      conditions.push(`e.event_date >= $${paramIndex} AND e.event_date <= $${paramIndex + 1}`);
      values.push(dateFromStr, dateToStr);
      paramIndex += 2;
    } else if (dateFromStr !== "") {
      conditions.push(`e.event_date >= $${paramIndex}`);
      values.push(dateFromStr);
      paramIndex++;
    } else if (dateToStr !== "") {
      conditions.push(`e.event_date <= $${paramIndex}`);
      values.push(dateToStr);
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

    /* Public browse list: only today and future (calendar date); past events appear on attendee dashboard */
    conditions.push("e.event_date >= CURRENT_DATE");

    const sortRaw =
      req.query.sort !== undefined && req.query.sort !== null ? String(req.query.sort).trim() : "";
    const orderBySql =
      sortRaw !== "" && Object.prototype.hasOwnProperty.call(EVENT_LIST_SORT_SQL, sortRaw)
        ? EVENT_LIST_SORT_SQL[sortRaw]
        : EVENT_LIST_SORT_SQL.date_asc;

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
        e.rejection_reason,
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
      WHERE ${conditions.length > 0 ? conditions.join(" AND ") : "TRUE"}
      GROUP BY e.id, u.id
      ORDER BY ${orderBySql}
    `;

    const result = await pool.query(query, values);

    return successResponse(res, result.rows, "Events fetched successfully");
  } catch (error) {
    return next(error);
  }
}

/** Admin-only: same shape as public list, but only events before today (all approval statuses). */
async function getPastEventsForAdmin(req, res, next) {
  try {
    const viewer = req.user && typeof req.user === "object" ? req.user : null;
    if (!viewer || viewer.role !== "admin") {
      return errorResponse(res, 403, "Forbidden");
    }

    const { keyword, category, date_from, date_to, location } = req.query;

    const conditions = [];
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

    const dateFromStr =
      date_from !== undefined && date_from !== null ? String(date_from).trim() : "";
    const dateToStr = date_to !== undefined && date_to !== null ? String(date_to).trim() : "";

    if (dateFromStr !== "" && !isValidEventDate(dateFromStr)) {
      return errorResponse(res, 400, "Invalid date filter format");
    }
    if (dateToStr !== "" && !isValidEventDate(dateToStr)) {
      return errorResponse(res, 400, "Invalid date filter format");
    }
    if (dateFromStr !== "" && dateToStr !== "" && dateFromStr > dateToStr) {
      return errorResponse(res, 400, "Invalid date range: start must be on or before end");
    }
    if (dateFromStr !== "" && dateToStr !== "") {
      conditions.push(`e.event_date >= $${paramIndex} AND e.event_date <= $${paramIndex + 1}`);
      values.push(dateFromStr, dateToStr);
      paramIndex += 2;
    } else if (dateFromStr !== "") {
      conditions.push(`e.event_date >= $${paramIndex}`);
      values.push(dateFromStr);
      paramIndex++;
    } else if (dateToStr !== "") {
      conditions.push(`e.event_date <= $${paramIndex}`);
      values.push(dateToStr);
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

    conditions.push("e.event_date < CURRENT_DATE");

    const sortRaw =
      req.query.sort !== undefined && req.query.sort !== null ? String(req.query.sort).trim() : "";
    const orderBySql =
      sortRaw !== "" && Object.prototype.hasOwnProperty.call(EVENT_LIST_SORT_SQL, sortRaw)
        ? EVENT_LIST_SORT_SQL[sortRaw]
        : EVENT_LIST_SORT_SQL.date_asc;

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
        e.rejection_reason,
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
      WHERE ${conditions.length > 0 ? conditions.join(" AND ") : "TRUE"}
      GROUP BY e.id, u.id
      ORDER BY ${orderBySql}
    `;

    const result = await pool.query(query, values);

    return successResponse(res, result.rows, "Past events fetched successfully");
  } catch (error) {
    return next(error);
  }
}

async function getMyEvents(req, res, next) {
  try {
    const userId = req.user.userId;
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
        rejection_reason,
        is_free,
        ticket_price,
        schedule_notes,
        calendar_link,
        created_at,
        updated_at
      FROM events
      WHERE organizer_id = $1
      ORDER BY event_date ASC, start_time ASC
      `,
      [userId]
    );

    return successResponse(res, result.rows, "My events fetched successfully");
  } catch (error) {
    return next(error);
  }
}

async function getMyRegisteredEvents(req, res, next) {
  try {
    const userId = req.user.userId;
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
        e.updated_at
      FROM events e
      INNER JOIN registrations r ON r.event_id = e.id
      WHERE r.user_id = $1
        AND r.registration_status = 'registered'
        AND e.approval_status = 'approved'
      ORDER BY e.event_date ASC, e.start_time ASC
      `,
      [userId]
    );

    return successResponse(res, result.rows, "My registered events fetched successfully");
  } catch (error) {
    return next(error);
  }
}

async function getPendingEvents(req, res, next) {
  try {
    const result = await pool.query(
      `
      SELECT
        e.id,
        e.organizer_id,
        e.title,
        e.category,
        e.event_date,
        e.start_time,
        e.location_name,
        e.approval_status,
        e.rejection_reason,
        e.created_at,
        u.full_name AS organizer_full_name
      FROM events e
      LEFT JOIN users u ON u.id = e.organizer_id
      WHERE e.approval_status = 'pending'
      ORDER BY e.created_at DESC
      `
    );

    return successResponse(res, result.rows, "Pending events fetched successfully");
  } catch (error) {
    return next(error);
  }
}

async function getPendingEventUpdates(req, res, next) {
  try {
    const result = await pool.query(
      `
      SELECT
        pur.id AS update_request_id,
        pur.event_id,
        pur.requested_by,
        pur.pending_data,
        pur.status,
        pur.created_at,
        pur.updated_at,
        e.title AS current_title,
        e.category AS current_category,
        e.event_date AS current_event_date,
        e.start_time AS current_start_time,
        e.location_name AS current_location_name,
        pur.pending_data->>'title' AS proposed_title,
        pur.pending_data->>'category' AS proposed_category,
        pur.pending_data->>'event_date' AS proposed_event_date,
        pur.pending_data->>'start_time' AS proposed_start_time,
        pur.pending_data->>'location_name' AS proposed_location_name,
        u.full_name AS organizer_full_name
      FROM event_update_requests pur
      JOIN events e ON e.id = pur.event_id
      LEFT JOIN users u ON u.id = e.organizer_id
      WHERE pur.status = 'pending'
      ORDER BY pur.updated_at DESC
      `
    );

    return successResponse(res, result.rows, "Pending event updates fetched successfully");
  } catch (error) {
    return next(error);
  }
}

async function getAllEventsForAdmin(req, res, next) {
  try {
    const result = await pool.query(
      `
      SELECT
        e.id,
        e.organizer_id,
        e.title,
        e.category,
        e.event_date,
        e.start_time,
        e.location_name,
        e.approval_status,
        e.rejection_reason,
        e.created_at,
        u.full_name AS organizer_full_name
      FROM events e
      LEFT JOIN users u ON u.id = e.organizer_id
      ORDER BY e.created_at DESC
      `
    );

    return successResponse(res, result.rows, "All events fetched successfully");
  } catch (error) {
    return next(error);
  }
}

async function getEventAttendees(req, res, next) {
  try {
    const { id: eventId } = req.params;
    const requester = req.user;

    const eventResult = await pool.query(
      `SELECT id, organizer_id FROM events WHERE id = $1`,
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      return errorResponse(res, 404, "Event not found");
    }

    const event = eventResult.rows[0];
    const isAdmin = requester?.role === "admin";
    const isOwnerOrganizer =
      requester?.role === "organizer" &&
      Number(requester?.userId) === Number(event.organizer_id);

    if (!isAdmin && !isOwnerOrganizer) {
      return errorResponse(res, 403, "Forbidden: insufficient permissions");
    }

    const attendeesResult = await pool.query(
      `
      SELECT
        u.id,
        u.full_name,
        u.email,
        r.registered_at
      FROM registrations r
      INNER JOIN users u ON u.id = r.user_id
      WHERE r.event_id = $1 AND r.registration_status = 'registered'
      ORDER BY r.registered_at ASC
      `,
      [eventId]
    );

    return successResponse(res, attendeesResult.rows, "Event attendees fetched successfully");
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
        e.rejection_reason,
        e.is_free,
        e.ticket_price,
        e.schedule_notes,
        e.calendar_link,
        e.created_at,
        e.updated_at,
        pur.id AS pending_update_request_id,
        pur.pending_data AS pending_update_data,
        pur.updated_at AS pending_update_requested_at,
        rejected_update.rejection_reason AS latest_update_rejection_reason,
        rejected_update.updated_at AS latest_update_rejected_at,
        u.full_name AS organizer_name,
        u.full_name AS organizer_full_name,
        u.email AS organizer_email,
        COUNT(r.id) FILTER (WHERE r.registration_status = 'registered')::INT AS active_registration_count,
        COUNT(r.id) FILTER (WHERE r.registration_status = 'registered')::INT AS registered_count,
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
      LEFT JOIN event_update_requests pur
        ON pur.event_id = e.id AND pur.status = 'pending'
      LEFT JOIN LATERAL (
        SELECT rejection_reason, updated_at
        FROM event_update_requests
        WHERE event_id = e.id
          AND status = 'rejected'
          AND rejection_reason IS NOT NULL
          AND BTRIM(rejection_reason) <> ''
        ORDER BY updated_at DESC
        LIMIT 1
      ) rejected_update ON TRUE
      WHERE e.id = $1
      GROUP BY e.id, u.id, pur.id, rejected_update.rejection_reason, rejected_update.updated_at
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return errorResponse(res, 404, "Event not found");
    }

    const eventRow = result.rows[0];
    eventRow.google_calendar_link = generateGoogleCalendarLink(eventRow);
    eventRow.google_maps_link = generateGoogleMapsSearchLink(eventRow);
    const viewer = req.optionalUser;
    const canViewUnrestricted =
      viewer?.role === "admin" ||
      (viewer?.role === "organizer" &&
        viewer.userId != null &&
        Number(viewer.userId) === Number(eventRow.organizer_id));

    if (!canViewUnrestricted && eventRow.approval_status !== "approved") {
      return errorResponse(res, 404, "Event not found");
    }

    if (!canViewUnrestricted) {
      delete eventRow.pending_update_request_id;
      delete eventRow.pending_update_data;
      delete eventRow.pending_update_requested_at;
      delete eventRow.latest_update_rejection_reason;
      delete eventRow.latest_update_rejected_at;
    }

    return successResponse(res, eventRow, "Event fetched successfully");
  } catch (error) {
    return next(error);
  }
}

async function createEvent(req, res, next) {
  try {
    if (!canManageEvents(req.user)) {
      return errorResponse(res, 403, "Only organizers or admins can create events");
    }

    if (bodyRequestsPaidEvent(req.body)) {
      return errorResponse(res, 400, "Only free events are supported");
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
      schedule_notes,
      calendar_link,
    } = req.body;

    const titleTrimmed = typeof title === "string" ? title.trim() : "";
    const descriptionTrimmed = typeof event_description === "string" ? event_description.trim() : "";

    if (
      !titleTrimmed ||
      !descriptionTrimmed ||
      !event_date ||
      !start_time ||
      capacity === undefined ||
      capacity === null ||
      String(capacity).trim() === ""
    ) {
      return errorResponse(
        res,
        400,
        "title, event_description, event_date, start_time, and capacity are required"
      );
    }

    const categoryNormalized = normalizeCategoryLabel(category);
    if (!categoryNormalized) {
      return errorResponse(res, 400, "category is required");
    }

    if (!isValidEventDate(event_date)) {
      return errorResponse(res, 400, "Invalid event_date format");
    }

    if (!isValidStartTime(start_time)) {
      return errorResponse(res, 400, "Invalid start_time format");
    }

    const endTimeTrimmed = typeof end_time === "string" ? end_time.trim() : "";
    if (!endTimeTrimmed) {
      return errorResponse(res, 400, "end_time is required");
    }
    if (!isValidStartTime(endTimeTrimmed)) {
      return errorResponse(res, 400, "Invalid end_time format");
    }

    if (!isValidCapacity(capacity)) {
      return errorResponse(res, 400, "capacity must be a number greater than 0");
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
        titleTrimmed,
        descriptionTrimmed,
        categoryNormalized,
        event_date,
        start_time,
        endTimeTrimmed,
        location_name || null,
        location_address || null,
        location_city || null,
        location_state || null,
        location_zip_code || null,
        latitude ?? null,
        longitude ?? null,
        Number(capacity),
        true,
        0,
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

    const body = req.body;
    if (bodyRequestsPaidEvent(body)) {
      return errorResponse(res, 400, "Only free events are supported");
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
      schedule_notes,
      calendar_link,
    } = body;

    if (hasOwn(body, "title")) {
      if (!isNonEmptyTrimmedString(title)) {
        return errorResponse(res, 400, "title must be a non-empty trimmed string");
      }
    }

    if (hasOwn(body, "event_description")) {
      if (!isNonEmptyTrimmedString(event_description)) {
        return errorResponse(res, 400, "event_description must be a non-empty trimmed string");
      }
    }

    if (hasOwn(body, "category") && !normalizeCategoryLabel(typeof category === "string" ? category : "")) {
      return errorResponse(res, 400, "category must be a non-empty trimmed string");
    }

    if (event_date !== undefined && !isValidEventDate(event_date)) {
      return errorResponse(res, 400, "Invalid event_date format");
    }

    if (start_time !== undefined && !isValidStartTime(start_time)) {
      return errorResponse(res, 400, "Invalid start_time format");
    }

    if (hasOwn(body, "end_time")) {
      const endTrimmed = typeof end_time === "string" ? end_time.trim() : "";
      if (!endTrimmed) {
        return errorResponse(res, 400, "end_time is required");
      }
      if (!isValidStartTime(endTrimmed)) {
        return errorResponse(res, 400, "Invalid end_time format");
      }
    }

    if (hasOwn(body, "capacity")) {
      if (!isValidCapacity(capacity)) {
        return errorResponse(res, 400, "capacity must be a number greater than 0");
      }
    }

    const existingEvent = await pool.query(`SELECT * FROM events WHERE id = $1`, [id]);
    if (existingEvent.rows.length === 0) {
      return errorResponse(res, 404, "Event not found");
    }

    const event = existingEvent.rows[0];
    if (req.user.role !== "admin" && Number(event.organizer_id) !== Number(req.user.userId)) {
      return errorResponse(res, 403, "You can only update your own events");
    }

    const updatePayload = buildEventUpdatePayload(body, event);

    if (event.approval_status === "approved" && req.user.role !== "admin") {
      const result = await pool.query(
        `
        INSERT INTO event_update_requests (
          event_id,
          requested_by,
          pending_data,
          status,
          rejection_reason
        )
        VALUES ($1, $2, $3, 'pending', NULL)
        ON CONFLICT (event_id) WHERE status = 'pending'
        DO UPDATE SET
          requested_by = EXCLUDED.requested_by,
          pending_data = EXCLUDED.pending_data,
          rejection_reason = NULL,
          updated_at = CURRENT_TIMESTAMP
        RETURNING *
        `,
        [id, req.user.userId, updatePayload]
      );

      return successResponse(
        res,
        { event, update_request: result.rows[0] },
        "Event update submitted for admin approval",
        202
      );
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
        approval_status = $19,
        rejection_reason = $20,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $21
      RETURNING *
      `,
      [
        ...eventUpdateValues(updatePayload),
        event.approval_status === "rejected" ? "pending" : event.approval_status,
        event.approval_status === "rejected" ? null : event.rejection_reason,
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

    const attendeesResult = await pool.query(
      `
      SELECT u.id, u.full_name, u.email
      FROM registrations r
      JOIN users u ON u.id = r.user_id
      WHERE r.event_id = $1
        AND r.registration_status = 'registered'
      `,
      [id]
    );

    const attendees = attendeesResult.rows;

    await pool.query(`DELETE FROM events WHERE id = $1`, [id]);
    
    for (const attendee of attendeesResult.rows) {
      try {
        await notifyEventDeleted({
          attendee,
          event: eventToDelete,
        });
      } catch (notificationError) {
        console.error("Event deleted notification failed:", notificationError.message);
      }
    }

    return successResponse(res, null, "Event deleted successfully");
  } catch (error) {
    return next(error);
  }
}

async function registerForEvent(req, res, next) {
  try {
    const { id: eventId } = req.params;
    const userId = req.user.userId;

    const eventResult = await pool.query(
      `
      SELECT
        id,
        title,
        event_description,
        event_date,
        start_time,
        end_time,
        location_name,
        location_address,
        location_city,
        location_state,
        location_zip_code,
        capacity,
        approval_status
      FROM events
      WHERE id = $1
      `,
      [eventId]
    );
    
    if (eventResult.rows.length === 0) {
      return errorResponse(res, 404, "Event not found");
    }

    if (eventResult.rows[0].approval_status !== "approved") {
      return errorResponse(res, 403, "Event is not approved for registration");
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

      const attendeeResult = await pool.query(
        `SELECT id, full_name, email FROM users WHERE id = $1`,
        [userId]
      );
      
      try {
        await notifyRegistrationConfirmation({
          attendee: attendeeResult.rows[0],
          event: eventResult.rows[0],
        });
      } catch (notificationError) {
        console.error("Registration notification failed:", notificationError.message)
      }
      
      const googleCalendarLink = generateGoogleCalendarLink(eventResult.rows[0]);
      
      return successResponse(
        res,
        {
          registration: revivedResult.rows[0],
          google_calendar_link: googleCalendarLink,
        },
        "RSVP registration successful",
        200
      );
    }

    const registrationResult = await pool.query(
      `
      INSERT INTO registrations (user_id, event_id)
      VALUES ($1, $2)
      RETURNING *
      `,
      [userId, eventId]
    );

    const attendeeResult = await pool.query(
      `SELECT id, full_name, email FROM users WHERE id = $1`,
      [userId]
    );
    
    try {
      await notifyRegistrationConfirmation({
        attendee: attendeeResult.rows[0],
        event: eventResult.rows[0],
      });
    } catch (notificationError) {
      console.error("Registration notification failed:", notificationError.message)
    }

    const googleCalendarLink = generateGoogleCalendarLink(eventResult.rows[0]);

    return successResponse(
      res,
      {
        registration: registrationResult.rows[0],
        google_calendar_link: googleCalendarLink,
      },
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

    const eventExists = await pool.query(`SELECT id, approval_status FROM events WHERE id = $1`, [eventId]);
    if (eventExists.rows.length === 0) {
      return errorResponse(res, 404, "Event not found");
    }

    if (eventExists.rows[0].approval_status !== "approved") {
      return errorResponse(res, 403, "Event is not approved for registration");
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

    const eventResult = await pool.query(
      `
      SELECT id, title, event_date, start_time
      FROM events
      WHERE id = $1
      `,
      [eventId]
    );
    
    const attendeeResult = await pool.query(
      `
      SELECT id, full_name, email
      FROM users
      WHERE id = $1
      `,
      [userId]
    );

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

    try {
      await notifyRegistrationCancelled({
        attendee: attendeeResult.rows[0],
        event: eventResult.rows[0],
      });
    } catch (notificationError) {
      console.error("Unregister notification failed:", notificationError.message);
    }

    return successResponse(res, null, "Unregistered successfully");
  } catch (error) {
    return next(error);
  }
}

async function approveEvent(req, res, next) {
  try {
    const { id } = req.params;

    const existing = await pool.query(
      `
      SELECT
        e.id,
        e.title,
        e.organizer_id,
        u.full_name AS organizer_name,
        u.email AS organizer_email
      FROM events e
      JOIN users u ON u.id = e.organizer_id
      WHERE e.id = $1
      `,
      [id]
    );

    if (existing.rows.length === 0) {
      return errorResponse(res, 404, "Event not found");
    }

    const result = await pool.query(
      `
      UPDATE events
      SET approval_status = 'approved', rejection_reason = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    const organizer = {
      id: existing.rows[0].organizer_id,
      full_name: existing.rows[0].organizer_name,
      email: existing.rows[0].organizer_email,
    };
    
    try {
      await notifyEventApprovalStatus({
        organizer,
        event: result.rows[0],
        status: "approved",
      });
    } catch (notificationError) {
      console.error("Approval notification failed:", notificationError.message)
    }

    return successResponse(res, result.rows[0], "Event approved successfully");
  } catch (error) {
    return next(error);
  }
}

async function approveEventUpdate(req, res, next) {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    await client.query("BEGIN");

    const existing = await client.query(
      `
      SELECT
        pur.id,
        pur.event_id,
        pur.pending_data,
        e.organizer_id,
        u.full_name AS organizer_name,
        u.email AS organizer_email
      FROM event_update_requests pur
      JOIN events e ON e.id = pur.event_id
      JOIN users u ON u.id = e.organizer_id
      WHERE pur.id = $1 AND pur.status = 'pending'
      FOR UPDATE OF pur
      `,
      [id]
    );

    if (existing.rows.length === 0) {
      await client.query("ROLLBACK");
      return errorResponse(res, 404, "Pending event update not found");
    }

    const request = existing.rows[0];
    const payload = request.pending_data;

    const eventResult = await client.query(
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
        approval_status = 'approved',
        rejection_reason = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $19
      RETURNING *
      `,
      [...eventUpdateValues(payload), request.event_id]
    );

    await client.query(
      `
      UPDATE event_update_requests
      SET status = 'approved', rejection_reason = NULL, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      `,
      [request.id]
    );

    await client.query("COMMIT");

    const organizer = {
      id: request.organizer_id,
      full_name: request.organizer_name,
      email: request.organizer_email,
    };

    try {
      await notifyEventApprovalStatus({
        organizer,
        event: eventResult.rows[0],
        status: "approved",
        isUpdate: true,
      });
    } catch (notificationError) {
      console.error("Update approval notification failed:", notificationError.message);
    }

    return successResponse(res, eventResult.rows[0], "Event update approved successfully");
  } catch (error) {
    await client.query("ROLLBACK");
    return next(error);
  } finally {
    client.release();
  }
}

async function rejectEvent(req, res, next) {
  try {
    const { id } = req.params;
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const raw =
      Object.prototype.hasOwnProperty.call(body, "rejection_reason") && body.rejection_reason !== undefined
        ? body.rejection_reason
        : Object.prototype.hasOwnProperty.call(body, "reason") && body.reason !== undefined
          ? body.reason
          : undefined;

    if (raw !== undefined && raw !== null && typeof raw !== "string") {
      return errorResponse(res, 400, "Rejection reason is required as non-empty text");
    }

    const rejection_reason = typeof raw === "string" ? raw.trim() : "";

    if (!rejection_reason) {
      return errorResponse(res, 400, "Rejection reason is required");
    }
    if (rejection_reason.length > MAX_REJECTION_REASON_LENGTH) {
      return errorResponse(
        res,
        400,
        `Rejection reason must be at most ${MAX_REJECTION_REASON_LENGTH} characters`
      );
    }

    const existing = await pool.query(
      `
      SELECT
        e.id,
        e.title,
        e.organizer_id,
        u.full_name AS organizer_name,
        u.email AS organizer_email
      FROM events e
      JOIN users u ON u.id = e.organizer_id
      WHERE e.id = $1
      `,
      [id]
    );

    if (existing.rows.length === 0) {
      return errorResponse(res, 404, "Event not found");
    }

    const result = await pool.query(
      `
      UPDATE events
      SET
        approval_status = 'rejected',
        rejection_reason = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
      `,
      [id, rejection_reason]
    );

    const organizer = {
      id: existing.rows[0].organizer_id,
      full_name: existing.rows[0].organizer_name,
      email: existing.rows[0].organizer_email,
    };
    
    try {
      await notifyEventApprovalStatus({
        organizer,
        event: result.rows[0],
        status: "rejected",
      });
    } catch (notificationError) {
      console.error("Rejection notification failed:", notificationError.message);
    }

    return successResponse(res, result.rows[0], "Event rejected successfully");
  } catch (error) {
    return next(error);
  }
}

async function rejectEventUpdate(req, res, next) {
  try {
    const { id } = req.params;
    const body = req.body && typeof req.body === "object" ? req.body : {};
    const raw =
      hasOwn(body, "rejection_reason") && body.rejection_reason !== undefined
        ? body.rejection_reason
        : hasOwn(body, "reason") && body.reason !== undefined
          ? body.reason
          : undefined;

    if (raw !== undefined && raw !== null && typeof raw !== "string") {
      return errorResponse(res, 400, "Rejection reason is required as non-empty text");
    }

    const rejection_reason = typeof raw === "string" ? raw.trim() : "";

    if (!rejection_reason) {
      return errorResponse(res, 400, "Rejection reason is required");
    }
    if (rejection_reason.length > MAX_REJECTION_REASON_LENGTH) {
      return errorResponse(
        res,
        400,
        `Rejection reason must be at most ${MAX_REJECTION_REASON_LENGTH} characters`
      );
    }

    const existing = await pool.query(
      `
      SELECT
        pur.id,
        pur.event_id,
        pur.pending_data,
        e.title,
        e.organizer_id,
        u.full_name AS organizer_name,
        u.email AS organizer_email
      FROM event_update_requests pur
      JOIN events e ON e.id = pur.event_id
      JOIN users u ON u.id = e.organizer_id
      WHERE pur.id = $1 AND pur.status = 'pending'
      `,
      [id]
    );

    if (existing.rows.length === 0) {
      return errorResponse(res, 404, "Pending event update not found");
    }

    const result = await pool.query(
      `
      UPDATE event_update_requests
      SET
        status = 'rejected',
        rejection_reason = $2,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
      `,
      [id, rejection_reason]
    );

    const request = existing.rows[0];
    const organizer = {
      id: request.organizer_id,
      full_name: request.organizer_name,
      email: request.organizer_email,
    };
    const proposedTitle = request.pending_data?.title || request.title;

    try {
      await notifyEventApprovalStatus({
        organizer,
        event: { id: request.event_id, title: proposedTitle },
        status: "rejected",
        isUpdate: true,
      });
    } catch (notificationError) {
      console.error("Update rejection notification failed:", notificationError.message);
    }

    return successResponse(res, result.rows[0], "Event update rejected successfully");
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getEventCategories,
  getAllEvents,
  getPastEventsForAdmin,
  getMyEvents,
  getMyRegisteredEvents,
  getPendingEvents,
  getPendingEventUpdates,
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
  approveEventUpdate,
  rejectEvent,
  rejectEventUpdate,
};