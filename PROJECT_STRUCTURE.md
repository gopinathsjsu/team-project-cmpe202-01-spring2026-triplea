# EventHub SJSU - Project Structure

## Project Overview

EventHub SJSU is a full-stack event web app. Users can discover, create, manage, and register for events. The app supports role-based login for attendees, organizers, and admins, plus RSVP workflows, event approval, notifications, Google Calendar links, Google Maps, and AWS deployment.

The repository is split into two main applications:

- `client`: React + Vite frontend.
- `server`: Node.js + Express backend connected to PostgreSQL/Supabase.

## Tech Stack

- Frontend: React, Vite, React Router.
- Backend: Node.js, Express, PostgreSQL client (`pg`).
- Authentication: bcrypt password hashing and JWT-based sessions.
- Database: Supabase PostgreSQL. `schema.sql` is kept as the final schema reference.
- Notifications: Nodemailer email service and `node-cron` reminder job.
- Integrations: Google Calendar link generation and Google Maps embed/link support.
- Deployment: AWS EC2, Nginx reverse proxy, AMI, Auto Scaling Group, and Application Load Balancer setup.

## Top-Level Folder Structure

```text
project-root/
  client/                 React frontend app
  server/                 Express backend app
  DB_DESIGN.md            Database design documentation
  PROJECT_JOURNAL.md      Sprint and Scrum meeting journal
  PROJECT_STRUCTURE.md    Project structure and folder guide
  README.md               General project documentation
```

## Frontend Structure (`client`)

```text
client/
  index.html
  package.json
  vite.config.js
  src/
    App.jsx
    main.jsx
    components/
    pages/
    services/
    styles/
    utils/
```

### Frontend Responsibilities

- `src/App.jsx`: Main React Router setup and protected route layout.
- `src/main.jsx`: React app entry point.
- `src/pages`: Screens for login, event browsing, details, dashboard, admin history, and event creation/editing.
- `src/components`: Reusable UI and route guard components.
- `src/services`: Frontend API wrappers for auth and event requests.
- `src/styles`: Global CSS and shared styles.
- `src/utils`: Helper functions for formatting, category labels, and JWT payload decoding.

### Frontend Pages

- `LoginPage.jsx`: Login and registration UI connected to authentication APIs.
- `EventListPage.jsx`: Event browsing page with backend data, categories, search, and filters.
- `EventDetailPage.jsx`: Event detail page with RSVP, organizer information, capacity state, Google Calendar, and map support.
- `DashboardPage.jsx`: Dashboard that changes based on the user role.
- `CreateEventPage.jsx`: Organizer event creation and event update page.
- `AdminPastEventsPage.jsx`: Admin view for previously handled events.

### Frontend Components

- `Navbar.jsx`: Main navigation shared across public and logged-in pages.
- `EventCard.jsx`: Reusable event summary card.
- `RSVPButton.jsx`: RSVP and unregister button.
- `EventMap.jsx`: Reusable Google Maps display and fallback link.
- `ProtectedRoute.jsx`: Requires an authenticated user.
- `OrganizerRoute.jsx`: Requires organizer access.
- `AdminRoute.jsx`: Requires admin access.

### Frontend Services and Utilities

- `services/api.js`: Shared API setup and helper logic.
- `services/authService.js`: Login, registration, profile, and auth frontend calls.
- `services/eventService.js`: Event, RSVP, attendee, admin, and organizer API calls.
- `utils/categoryLabel.js`: Category display label helper.
- `utils/decodeJwtPayload.js`: JWT payload decoding helper.
- `utils/formatDisplayDate.js`: Date display formatting helper.

## Backend Structure (`server`)

```text
server/
  app.js
  package.json
  config/
  controllers/
  jobs/
  middleware/
  models/
  routes/
  utils/
```

### Backend Responsibilities

- `app.js`: Express app setup, CORS, JSON middleware, health check, API routes, global error handler, and reminder job startup.
- `config/db.js`: PostgreSQL/Supabase database connection pool.
- `routes`: Express route definitions grouped by feature.
- `controllers`: Request handlers and route-level business logic.
- `models`: Database query/model files and schema file.
- `middleware`: Authentication, authorization, validation, and error-handling middleware.
- `utils`: Shared backend helpers for JWTs, passwords, validation, responses, email, notifications, and calendar links.
- `jobs`: Scheduled background jobs such as event reminder emails.

### Backend Routes

- `/`: Server status message.
- `/health`: Database connectivity health check.
- `/api/auth/register`: Register a user.
- `/api/auth/login`: Log in and receive a JWT.
- `/api/auth/profile`: Get the authenticated user's profile.
- `/api/events`: List public/visible events with optional login context.
- `/api/events/categories`: Fetch event categories.
- `/api/events/:id`: Fetch a single event detail.
- `/api/events`: Create an event as an organizer or admin.
- `/api/events/:id`: Update or delete an event as an organizer or admin.
- `/api/events/:id/rsvp`: Register for or unregister from an event as an attendee.
- `/api/events/:id/rsvp-status`: Check the current attendee RSVP status.
- `/api/events/my-events`: Organizer event management.
- `/api/events/my-registrations`: Attendee registration history.
- `/api/events/:id/attendees`: Organizer/admin attendee management.
- `/api/events/pending`: Admin list for pending event approvals.
- `/api/events/all`: Admin full event list.
- `/api/events/admin/past`: Admin past/handled events.
- `/api/events/:id/approve` and `/api/events/:id/reject`: Admin event approval actions.
- `/api/events/updates/pending`: Admin pending event update requests.
- `/api/events/updates/my-rejected`: Organizer rejected update requests.
- `/api/events/updates/:id/approve` and `/api/events/updates/:id/reject`: Admin event update approval actions.

### Backend Controllers

- `authController.js`: Registration, login, password verification, JWT creation, and profile retrieval.
- `eventController.js`: Event CRUD, browsing, filtering, RSVP, attendee management, organizer workflows, admin approval/rejection, notifications, and integration data.

### Backend Middleware

- `authMiddleware.js`: Required and optional JWT authentication.
- `authorizeRole.js`: Role-based access control for attendee, organizer, and admin endpoints.
- `validateEventIdParam.js`: Event ID route parameter validation.
- `errorHandler.js`: Centralized error responses for unhandled server errors.

### Backend Models

- `userModel.js`: User database operations.
- `eventModel.js`: Database operations for events, RSVP, admin, organizer, notifications, and integrations.
- `schema.sql`: Baseline database schema.

### Backend Utilities and Jobs

- `jwtUtils.js`: JWT signing and verification helpers.
- `passwordUtils.js`: Password hashing and comparison helpers.
- `validation.js`: Event and request validation helpers.
- `responseHandler.js`: Consistent API response helper functions.
- `calendarUtils.js`: Google Calendar URL generation.
- `emailService.js`: Email sending helper.
- `notificationService.js`: Notification creation and email coordination.
- `eventReminderJob.js`: Scheduled one-day-before event reminder job.

### Database Schema

- `server/models/schema.sql`: Final Supabase PostgreSQL schema kept as a project reference.

## Routing and Access Control

### Public Routes

- `/login`
- `/events`
- `/events/:id`

### Authenticated Routes

- `/dashboard`

### Organizer Routes

- `/create-event`
- `/events/:id/edit`

### Admin Routes

- `/admin/past-events`

Backend route protection matches these frontend routes using JWT checks and role-based middleware.

## API Naming Conventions

The backend uses REST-style routes with a global `/api` prefix:

- Use plural nouns for resource paths.
- Keep route names resource-oriented and consistent.
- Protect role-specific behavior with middleware instead of duplicate controllers.
- Keep frontend API calls centralized in `client/src/services`.

Example endpoints:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/profile`
- `GET /api/events`
- `GET /api/events/:id`
- `POST /api/events`
- `PUT /api/events/:id`
- `DELETE /api/events/:id`
- `POST /api/events/:id/rsvp`
- `DELETE /api/events/:id/rsvp`
- `GET /api/events/pending`
- `PUT /api/events/:id/approve`
- `PUT /api/events/:id/reject`

## Where Future Files Should Go

- Add new page-level React views to `client/src/pages`.
- Add shared UI or route guard components to `client/src/components`.
- Add frontend API calls to `client/src/services`.
- Add frontend helper functions to `client/src/utils`.
- Add shared styles to `client/src/styles`.
- Add new backend endpoint groups to `server/routes`.
- Add matching request handlers to `server/controllers`.
- Add reusable database queries to `server/models`.
- Add authentication, authorization, validation, and error handling to `server/middleware`.
- Add shared backend helpers to `server/utils`.
- Add scheduled backend tasks to `server/jobs`.
- Keep `server/models/schema.sql` updated when the Supabase database structure changes.

## Development Notes

- Keep frontend pages focused on UI flow and use `src/services` for API calls.
- Keep backend routes thin and place business logic in controllers/models.
- Use middleware for authentication, role checks, and repeated validation.
- Keep API responses and error handling consistent across endpoints.
- Update this file when major pages, integrations, routes, or deployment parts change.
