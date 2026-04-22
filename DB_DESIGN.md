# EventHub SJSU - Database Design

## Overview

This document defines the database entities, relationships, constraints, and implementation rules for EventHub SJSU. It is intended to be implementation-ready guidance for building the PostgreSQL schema.

## Database Goal

The database must support:

- User registration and login
- Role-based access (`attendee`, `organizer`, `admin`)
- Event creation and management
- Admin approval workflow
- Event discovery
- RSVP / registration with capacity control
- Organizer attendee management
- Notifications
- Basic support for calendar and map data

## Main Entities

Core tables:

- `users`
- `events`
- `registrations`
- `notifications`

Optional future tables:

- `categories`
- `event_reminders`
- `audit_logs`

## Entity Relationships

- One organizer (`users`) can create many `events`.
- One attendee (`users`) can have many `registrations`.
- One `event` can have many `registrations`.
- One `user` can receive many `notifications`.
- One `event` may generate many `notifications`.

## Table Definitions

### A) `users`

**Purpose**

- Stores account identity, authentication data, and authorization role.

**Columns**

- `id`
- `full_name`
- `email`
- `password_hash`
- `role`
- `created_at`
- `updated_at`

**Constraints**

- `id` primary key
- `email` unique and not null
- `password_hash` not null
- `role` must be one of: `attendee`, `organizer`, `admin`

**Notes**

- Password must never be stored in plaintext.
- Use UTC timestamps for audit consistency.
- `created_at` should default to `CURRENT_TIMESTAMP`.
- `updated_at` should default to `CURRENT_TIMESTAMP`.

### B) `events`

**Purpose**

- Stores event records created by organizers, including schedule, location, pricing, and approval status.

**Columns**

- `id`
- `organizer_id`
- `title`
- `description`
- `category`
- `event_date`
- `start_time`
- `end_time`
- `location_name`
- `address`
- `city`
- `state`
- `zip_code`
- `latitude`
- `longitude`
- `capacity`
- `approval_status`
- `is_free`
- `ticket_price`
- `schedule_notes`
- `calendar_link`
- `created_at`
- `updated_at`

**Constraints**

- `organizer_id` references `users.id`
- `title` not null
- `description` not null
- `event_date` not null
- `start_time` not null
- `capacity > 0`
- `approval_status` must be one of: `pending`, `approved`, `rejected`
- `is_free` boolean
- `ticket_price >= 0`
- If `is_free = true`, `ticket_price` should be `0`
- `organizer_id` must reference a user whose `role` is `organizer` or `admin`

**Notes**

- `approval_status` should default to `pending`.
- `latitude` and `longitude` are optional to support map integration.
- `created_at` should default to `CURRENT_TIMESTAMP`.
- `updated_at` should default to `CURRENT_TIMESTAMP`.

### C) `registrations`

**Purpose**

- Tracks attendee registrations (and cancellations) per event.

**Columns**

- `id`
- `user_id`
- `event_id`
- `registration_status`
- `registered_at`
- `cancelled_at`
- `created_at`
- `updated_at`

**Constraints**

- `user_id` references `users.id`
- `event_id` references `events.id`
- `registration_status` must be one of: `registered`, `cancelled`
- Unique constraint on (`user_id`, `event_id`)

**Business Rules**

- Only approved events can accept registrations.
- Active registrations are rows where `registration_status = 'registered'`.
- Total active registrations cannot exceed event capacity.
- Cancelled registrations should not count toward active capacity.
- Only users with attendee role should register.

**Notes**

- Keep cancelled rows for history and analytics.
- `created_at` should default to `CURRENT_TIMESTAMP`.
- `updated_at` should default to `CURRENT_TIMESTAMP`.

### D) `notifications`

**Purpose**

- Stores user-facing notification messages related to registrations, approvals, rejections, and reminders.

**Columns**

- `id`
- `user_id`
- `event_id`
- `type`
- `message`
- `is_read`
- `sent_at`
- `created_at`

**Allowed types**

- `registration_confirmation`
- `approval_notification`
- `rejection_notification`
- `event_reminder`

**Constraints**

- `user_id` references `users.id`
- `event_id` may be nullable
- `type` not null
- `message` not null
- `is_read` default `false`

**Notes**

- `event_id` is nullable so system-level notifications can be sent without linking to a specific event.
- `created_at` should default to `CURRENT_TIMESTAMP`.

## Recommended Indexes

- `users(email)`
- `events(organizer_id)`
- `events(approval_status)`
- `events(event_date)`
- `events(category)`
- `events(city)`
- `registrations(user_id, event_id)` unique
- `registrations(event_id)`
- `registrations(user_id)`
- `registrations(registration_status)`
- `notifications(user_id)`
- `notifications(event_id)`
- `notifications(type)`

## Business Rules That Must Be Enforced

- Email must be unique.
- Role values must be valid (`attendee`, `organizer`, `admin`).
- Password must be stored only as a hash.
- Only organizers/admins can create events.
- Event must be approved before discovery.
- Duplicate registration for the same user/event is not allowed.
- Registration is blocked when capacity is full.
- Cancelled registrations remain in DB but do not count as active.
- Notifications belong to users and may optionally reference events.

## Suggested Query Use Cases

- Find user by email.
- Get all approved events.
- Search/filter events.
- Get event by ID with organizer info.
- Count active registrations.
- Get organizer's events.
- Get attendee list.
- Get pending events for admin review.
- Approve/reject event.
- Get notifications for a user.

## Minimal ERD Summary

- `users.id` -> `events.organizer_id`
- `users.id` -> `registrations.user_id`
- `events.id` -> `registrations.event_id`
- `users.id` -> `notifications.user_id`
- `events.id` -> `notifications.event_id` (nullable)

## Final Schema Recommendation

Recommended table creation order:

1. `users`
2. `events`
3. `registrations`
4. `notifications`

## Open Decisions

- `category` as string vs separate `categories` table
- Whether `ticket_price` is needed for mock payments
- Dashboard query strategy by role
- Cancelled registrations kept vs deleted (recommended: keep with status)
