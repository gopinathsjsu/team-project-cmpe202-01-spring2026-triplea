# EventHub SJSU - Database Design

## Overview

This document describes the final database structure for EventHub SJSU. The database supports role-based authentication, event creation and approval, event update requests, attendee RSVP workflows, organizer attendee management, notifications, calendar links, and map-related location data.

The implementation uses PostgreSQL/Supabase. The executable final schema is maintained in `server/models/schema.sql`.

## Database Goals

- Store users with secure password hashes and role-based access.
- Support attendee, organizer, and admin workflows.
- Store event details, schedule, location, capacity, approval status, and calendar/map data.
- Track RSVP registrations, cancellations, attendee removals, and capacity rules.
- Support admin review for new events and organizer event update requests.
- Store notification records for confirmations, approvals, rejections, reminders, cancellations, deletions, and attendee removals.

## Main Tables

- `users`
- `events`
- `registrations`
- `notifications`
- `event_update_requests`

## Entity Relationships

- One `users` row with organizer/admin role can create many `events`.
- One attendee `users` row can have many `registrations`.
- One `events` row can have many `registrations`.
- One `users` row can receive many `notifications`.
- One `events` row can generate many `notifications`.
- One `events` row can have many `event_update_requests`.
- One organizer/admin `users` row can submit many `event_update_requests`.
- One admin/organizer `users` row may be referenced as `registrations.removed_by` when an attendee is removed.

## Table Definitions

### `users`

**Purpose**

- Stores account identity, authentication data, and authorization role.

**Columns**

- `id`: Primary key.
- `full_name`: User display name.
- `email`: Unique login email.
- `password_hash`: Hashed password value.
- `role`: User role.
- `created_at`: Creation timestamp.
- `updated_at`: Last update timestamp.

**Constraints**

- `email` must be unique and not null.
- `password_hash` must not be null.
- `role` must be one of `attendee`, `organizer`, or `admin`.

**Notes**

- Plaintext passwords must never be stored.
- `created_at` and `updated_at` default to `CURRENT_TIMESTAMP`.

### `events`

**Purpose**

- Stores event records created by organizers/admins, including schedule, location, capacity, approval state, rejection reason, and calendar/map fields.

**Columns**

- `id`: Primary key.
- `organizer_id`: References `users.id`.
- `title`: Event title.
- `event_description`: Event description.
- `category`: Event category.
- `event_date`: Event date.
- `start_time`: Event start time.
- `end_time`: Optional event end time.
- `location_name`: Venue or location name.
- `location_address`: Street address.
- `location_city`: City.
- `location_state`: State.
- `location_zip_code`: ZIP code.
- `latitude`: Optional map latitude.
- `longitude`: Optional map longitude.
- `capacity`: Maximum attendee capacity.
- `approval_status`: Admin approval status.
- `is_free`: Whether the event is free.
- `ticket_price`: Ticket price value.
- `schedule_notes`: Optional schedule details.
- `calendar_link`: Generated calendar link.
- `created_at`: Creation timestamp.
- `updated_at`: Last update timestamp.
- `rejection_reason`: Admin rejection reason when applicable.

**Constraints**

- `organizer_id` references `users.id`.
- `title`, `event_description`, `event_date`, `start_time`, and `capacity` are required.
- `capacity` must be greater than `0`.
- `approval_status` must be one of `pending`, `approved`, or `rejected`.
- `approval_status` defaults to `pending`.
- `is_free` defaults to `true`.
- `ticket_price` defaults to `0` and must be greater than or equal to `0`.

**Notes**

- `latitude` and `longitude` support Google Maps integration.
- `calendar_link` supports Google Calendar integration.
- Rejected events store the explanation in `rejection_reason`.

### `registrations`

**Purpose**

- Tracks attendee registrations, cancellations, and organizer/admin removals for events.

**Columns**

- `id`: Primary key.
- `user_id`: References the attendee in `users.id`.
- `event_id`: References `events.id`.
- `registration_status`: Registration state.
- `registered_at`: Registration timestamp.
- `cancelled_at`: Cancellation timestamp.
- `created_at`: Creation timestamp.
- `updated_at`: Last update timestamp.
- `removal_reason`: Reason an attendee was removed.
- `removed_by`: References the user who removed the attendee.

**Constraints**

- `user_id` references `users.id`.
- `event_id` references `events.id`.
- `removed_by` references `users.id`.
- `registration_status` must be one of `registered` or `cancelled`.
- `registration_status` defaults to `registered`.

**Business Rules**

- Only approved events should accept attendee registrations.
- Active registrations are rows where `registration_status = 'registered'`.
- Active registrations must not exceed event capacity.
- Cancelled registrations remain in the database but do not count toward active capacity.
- Attendee removal records should store `removal_reason` and `removed_by` when applicable.

### `notifications`

**Purpose**

- Stores notification records for user-facing messages and email-related workflows.

**Columns**

- `id`: Primary key.
- `user_id`: Notification recipient, references `users.id`.
- `event_id`: Optional related event, references `events.id`.
- `notif_type`: Notification category.
- `notif_message`: Message content.
- `is_read`: Read/unread state.
- `sent_at`: Timestamp when notification was sent.
- `created_at`: Creation timestamp.

**Allowed Notification Types**

- `registration_confirmation`
- `approval_notification`
- `rejection_notification`
- `event_reminder`
- `registration_cancelled`
- `event_deleted`
- `attendee_removed`

**Constraints**

- `user_id` references `users.id`.
- `event_id` references `events.id` and may be nullable.
- `notif_type` must be one of the allowed notification types.
- `notif_message` must not be null.
- `is_read` defaults to `false`.

### `event_update_requests`

**Purpose**

- Stores organizer-submitted event update requests that require admin approval before changing the live event.

**Columns**

- `id`: Primary key.
- `event_id`: Event being updated, references `events.id`.
- `requested_by`: User who requested the update, references `users.id`.
- `pending_data`: JSON payload containing the requested event changes.
- `status`: Request status.
- `rejection_reason`: Admin rejection reason when applicable.
- `created_at`: Creation timestamp.
- `updated_at`: Last update timestamp.

**Constraints**

- `event_id` references `events.id`.
- `requested_by` references `users.id`.
- `pending_data` must not be null.
- `status` must be one of `pending`, `approved`, or `rejected`.
- `status` defaults to `pending`.

**Notes**

- `pending_data` is stored as `jsonb` so event updates can be reviewed before being applied to the main `events` table.

## Business Rules

- User emails must be unique.
- User roles must be valid: `attendee`, `organizer`, or `admin`.
- Passwords must be stored only as hashes.
- Only organizers/admins can create or update events.
- New events start with `approval_status = 'pending'`.
- Rejected events and rejected update requests should store a rejection reason.
- Only approved events should be visible for normal attendee discovery.
- RSVP is blocked when an event is full.
- Cancelled registrations do not count toward capacity.
- Organizer/admin attendee removal should preserve removal history.
- Notifications belong to users and may optionally reference events.
- Event update requests must be approved before changes are applied to a live event.

## Suggested Query Use Cases

- Find user by email during login.
- Get public approved events with search and filters.
- Get event details with organizer information and active registration count.
- Check attendee RSVP status for an event.
- Count active registrations to enforce capacity.
- Get attendee registration history.
- Get organizer-created events.
- Get attendees for an organizer/admin-managed event.
- Get pending events for admin approval.
- Get pending event update requests for admin review.
- Approve or reject events and event update requests.
- Create notification records and send email notifications.
- Get upcoming events for the one-day reminder job.

## Minimal ERD Summary

- `users.id` -> `events.organizer_id`
- `users.id` -> `registrations.user_id`
- `users.id` -> `registrations.removed_by`
- `events.id` -> `registrations.event_id`
- `users.id` -> `notifications.user_id`
- `events.id` -> `notifications.event_id`
- `users.id` -> `event_update_requests.requested_by`
- `events.id` -> `event_update_requests.event_id`

## Final Schema Creation Order

Recommended table creation order:

1. `users`
2. `events`
3. `registrations`
4. `notifications`
5. `event_update_requests`
