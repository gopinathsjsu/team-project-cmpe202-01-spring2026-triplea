const pool = require("../config/db");
const { sendEmail } = require("./emailService");

async function createNotification({ userId, eventId, type, message }) {
  const result = await pool.query(
    `
    INSERT INTO notifications (
      user_id,
      event_id,
      notif_type,
      notif_message
    )
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
    [userId, eventId || null, type, message]
  );

  return result.rows[0];
}

async function notifyRegistrationConfirmation({ attendee, event }) {
  const message = `You have successfully registered for ${event.title}.`;

  await createNotification({
    userId: attendee.id,
    eventId: event.id,
    type: "registration_confirmation",
    message,
  });

  await sendEmail({
    to: attendee.email,
    subject: `Registration confirmed: ${event.title}`,
    text: message,
    html: `
      <h2>Registration Confirmed</h2>
      <p>${message}</p>
      <p><strong>Date:</strong> ${event.event_date}</p>
      <p><strong>Time:</strong> ${event.start_time}</p>
    `,
  });
}

async function notifyEventApprovalStatus({ organizer, event, status, isUpdate = false }) {
  const isApproved = status === "approved";

  const type = isApproved
    ? "approval_notification"
    : "rejection_notification";

  const message = isApproved
    ? `Your ${isUpdate ? "event update" : "event"} "${event.title}" has been approved.`
    : `Your ${isUpdate ? "event update" : "event"} "${event.title}" has been rejected.`;

  await createNotification({
    userId: organizer.id,
    eventId: event.id,
    type,
    message,
  });

  await sendEmail({
    to: organizer.email,
    subject: isApproved
      ? `${isUpdate ? "Event update" : "Event"} approved: ${event.title}`
      : `${isUpdate ? "Event update" : "Event"} rejected: ${event.title}`,
    text: message,
    html: `
      <h2>${isUpdate ? "Event Update" : "Event"} ${isApproved ? "Approved" : "Rejected"}</h2>
      <p>${message}</p>
    `,
  });
}

async function notifyRegistrationCancelled({ attendee, event }) {
  const message = `You have successfully unregistered from "${event.title}".`;

  await createNotification({
    userId: attendee.id,
    eventId: event.id,
    type: "registration_cancelled",
    message,
  });

  await sendEmail({
    to: attendee.email,
    subject: `Unregistered from: ${event.title}`,
    text: message,
    html: `
      <h2>Registration Cancelled</h2>
      <p>${message}</p>
    `,
  });
}

async function notifyEventDeleted({ attendee, event }) {
  const message = `The event "${event.title}" has been deleted. Your registration is no longer active.`;

  await createNotification({
    userId: attendee.id,
    eventId: null,
    type: "event_deleted",
    message,
  });

  await sendEmail({
    to: attendee.email,
    subject: `Event deleted: ${event.title}`,
    text: message,
    html: `
      <h2>Event Deleted</h2>
      <p>${message}</p>
    `,
  });
}

async function notifyEventReminder({ attendee, event }) {
  const message = `Reminder: "${event.title}" is happening tomorrow.`;

  await createNotification({
    userId: attendee.id,
    eventId: event.id,
    type: "event_reminder",
    message,
  });

  await sendEmail({
    to: attendee.email,
    subject: `Reminder: ${event.title} is tomorrow`,
    text: message,
    html: `
      <h2>Event Reminder</h2>
      <p>${message}</p>
      <p><strong>Date:</strong> ${event.event_date}</p>
      <p><strong>Time:</strong> ${event.start_time}</p>
    `,
  });
}

module.exports = {
  createNotification,
  notifyRegistrationConfirmation,
  notifyEventApprovalStatus,
  notifyRegistrationCancelled,
  notifyEventDeleted,
  notifyEventReminder,
};