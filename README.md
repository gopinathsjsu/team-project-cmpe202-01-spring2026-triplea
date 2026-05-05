[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/xRTHk3Dv)

# EventHub SJSU

EventHub SJSU is a full-stack Eventbrite-like platform for discovering, creating, managing, and registering for events. It was built for CMPE 202 using Scrum-based development across multiple sprints.

## Features

- Role-based authentication for attendees, organizers, and admins.
- User registration and login with bcrypt password hashing and JWT authentication.
- Event discovery with category, date, location, keyword search, and sorting support.
- Event detail pages with organizer information, capacity status, RSVP actions, Google Calendar links, and Google Maps support.
- Organizer workflows for creating events, updating events, viewing attendees, and removing attendees.
- Admin workflows for approving/rejecting events and reviewing event update requests.
- RSVP workflows with duplicate registration prevention, cancellation, capacity checks, and attendee removal tracking.
- Email notification workflows for registration confirmations, approvals, rejections, reminders, cancellations, event deletion, and attendee removal.
- Scheduled event reminder job that runs before upcoming events.
- AWS deployment preparation with EC2, Nginx, AMI, Auto Scaling Group, and Application Load Balancer.

## Tech Stack

- Frontend: React, Vite, React Router.
- Backend: Node.js, Express.
- Database: PostgreSQL/Supabase using the `pg` client.
- Authentication: JWT, bcrypt.
- Notifications: Nodemailer, node-cron.
- Deployment: AWS EC2, Nginx, Auto Scaling Group, Application Load Balancer.

## Repository Structure

```text
project-root/
  client/                 React + Vite frontend
  server/                 Express backend
  DB_DESIGN.md            Final database design documentation
  PROJECT_JOURNAL.md      Scrum meeting and sprint journal
  PROJECT_STRUCTURE.md    Architecture and folder guide
  README.md               Project overview and setup guide
```

See `PROJECT_STRUCTURE.md` for a more detailed folder-by-folder breakdown.

## Getting Started

Run the frontend and backend in separate terminals.

### Prerequisites

- Node.js and npm.
- PostgreSQL/Supabase database.
- Email SMTP account for notification testing.

### Environment Variables

Create `server/.env`:

```env
PORT=5000

DB_HOST=your-database-host
DB_PORT=5432
DB_NAME=your-database-name
DB_USER=your-database-user
DB_PASSWORD=your-database-password

JWT_SECRET=your-jwt-secret

EMAIL_HOST=your-smtp-host
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email-user
EMAIL_PASS=your-email-password
EMAIL_FROM=your-sender-email
```

Optional frontend environment file, `client/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000
```

### Client (React + Vite)

```bash
cd client
npm install
npm run dev
```

`npm run dev` runs the Vite development server.

### Server (Express)

```bash
cd server
npm install
npm run dev
```

`npm run dev` runs the server with auto-restart on file changes.

## Production / Deploy Mode

### Server (Express)

```bash
cd server
npm install
npm start
```

`npm start` runs `node app.js` for production-style execution.

### Client Build

```bash
cd client
npm install
npm run build
```

`npm run build` creates the production frontend build in `client/dist`.

## Database

The final database schema is documented in:

- `server/models/schema.sql`
- `DB_DESIGN.md`

Main tables:

- `users`
- `events`
- `registrations`
- `notifications`
- `event_update_requests`

The schema supports user roles, event approval, event update requests, RSVP status, attendee removal reasons, notification types, calendar links, and map coordinates.

## API Overview

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/profile`

### Events

- `GET /api/events`
- `GET /api/events/categories`
- `GET /api/events/:id`
- `POST /api/events`
- `PUT /api/events/:id`
- `DELETE /api/events/:id`
- `POST /api/events/:id/rsvp`
- `DELETE /api/events/:id/rsvp`
- `GET /api/events/:id/rsvp-status`

### Organizer and Admin

- `GET /api/events/my-events`
- `GET /api/events/my-registrations`
- `GET /api/events/:id/attendees`
- `DELETE /api/events/:id/attendees/:attendeeId`
- `GET /api/events/pending`
- `GET /api/events/all`
- `GET /api/events/admin/past`
- `PUT /api/events/:id/approve`
- `PUT /api/events/:id/reject`
- `GET /api/events/updates/pending`
- `GET /api/events/updates/my-rejected`
- `PUT /api/events/updates/:id/approve`
- `PUT /api/events/updates/:id/reject`

## Project Documentation

- `PROJECT_JOURNAL.md`: Sprint-by-sprint Scrum meeting records and individual contributions.
- `PROJECT_STRUCTURE.md`: Current frontend/backend architecture and folder responsibilities.
- `DB_DESIGN.md`: Final database design, relationships, constraints, and business rules.

## Demo Day Flow

Recommended walkthrough:

1. Register or log in as an attendee, organizer, or admin.
2. Browse approved events using search and filters.
3. Open an event detail page and review map/calendar support.
4. RSVP as an attendee and verify dashboard registration status.
5. Create or update an event as an organizer.
6. Approve or reject events/update requests as an admin.
7. Show notification behavior and attendee management workflows.
