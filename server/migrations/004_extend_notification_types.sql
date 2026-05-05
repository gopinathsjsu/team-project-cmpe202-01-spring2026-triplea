ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_notif_type_check;

ALTER TABLE notifications
  ADD CONSTRAINT notifications_notif_type_check CHECK (
    notif_type IN (
      'registration_confirmation',
      'approval_notification',
      'rejection_notification',
      'event_reminder',
      'registration_cancelled',
      'event_deleted',
      'attendee_removed'
    )
  );
