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

async function notifyEventApprovalStatus({ organizer, event, status }) {
  const isApproved = status === "approved";

  const type = isApproved
    ? "approval_notification"
    : "rejection_notification";

  const message = isApproved
    ? `Your event "${event.title}" has been approved.`
    : `Your event "${event.title}" has been rejected.`;

  await createNotification({
    userId: organizer.id,
    eventId: event.id,
    type,
    message,
  });

  await sendEmail({
    to: organizer.email,
    subject: isApproved
      ? `Event approved: ${event.title}`
      : `Event rejected: ${event.title}`,
    text: message,
    html: `
      <h2>${isApproved ? "Event Approved" : "Event Rejected"}</h2>
      <p>${message}</p>
    `,
  });
}

module.exports = {
  createNotification,
  notifyRegistrationConfirmation,
  notifyEventApprovalStatus,
};