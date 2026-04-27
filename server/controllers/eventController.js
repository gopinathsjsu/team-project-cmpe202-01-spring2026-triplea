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
};

module.exports = {
  getAllEvents,
  createEvent,
  updateEvent,
};