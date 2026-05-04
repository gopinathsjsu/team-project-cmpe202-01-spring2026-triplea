const cron = require("node-cron");
const pool = require("../config/db");
const { notifyEventReminder } = require("../utils/notificationService");

async function sendEventReminders() {
  try {
    const result = await pool.query(
      `
      SELECT
        e.id AS event_id,
        e.title,
        e.event_date,
        e.start_time,
        u.id AS attendee_id,
        u.full_name,
        u.email
      FROM events e
      JOIN registrations r ON r.event_id = e.id
      JOIN users u ON u.id = r.user_id
      WHERE e.approval_status = 'approved'
        AND r.registration_status = 'registered'
        AND e.event_date = CURRENT_DATE + INTERVAL '1 day'
        AND NOT EXISTS (
          SELECT 1
          FROM notifications n
          WHERE n.user_id = u.id
            AND n.event_id = e.id
            AND n.notif_type = 'event_reminder'
        )
      `
    );

    for (const row of result.rows) {
      try {
        await notifyEventReminder({
          attendee: {
            id: row.attendee_id,
            full_name: row.full_name,
            email: row.email,
          },
          event: {
            id: row.event_id,
            title: row.title,
            event_date: row.event_date,
            start_time: row.start_time,
          },
        });
      } catch (notificationError) {
        console.error("Reminder notification failed:", notificationError.message);
      }
    }

    console.log(`Event reminder job completed. Sent ${result.rows.length} reminders.`);
  } catch (error) {
    console.error("Event reminder job failed:", error.message);
  }
}

function startEventReminderJob() {
  cron.schedule("0 9 * * *", sendEventReminders);
  console.log("Event reminder job scheduled for 9:00 AM daily.");
}

module.exports = {
  startEventReminderJob,
  sendEventReminders,
};