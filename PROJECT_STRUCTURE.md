# EventHub SJSU - Project Structure

## Project Overview

EventHub SJSU is a full-stack web application built with:

- Frontend: React with Vite
- Backend: Node.js with Express
- Database: PostgreSQL

The repository is split into frontend and backend applications to keep responsibilities clear and maintainable.

## Folder Structure

```text
/project-root
  /client
  /server
```

### Frontend (`/client`)

- `src/pages` -> Page-level components (for example: Login, Event List, Event Detail, Dashboard)
- `src/components` -> Reusable UI components
- `src/services` -> Frontend API call modules
- `src/styles` -> CSS and shared styles

### Backend (`/server`)

- `routes` -> API endpoint definitions
- `controllers` -> Request handling and business logic
- `models` -> Database model definitions
- `middleware` -> Cross-cutting logic (auth, validation, etc.)
- `config` -> Database connection and application configuration files

## Main Folder Responsibilities

- `client/src/pages`: Page-level React views such as login, dashboard, and event pages.
- `client/src/components`: Reusable UI components shared across pages.
- `client/src/services`: Frontend service modules, including API request helpers.
- `client/src/styles`: Global and shared CSS styles.
- `server/routes`: Express route definitions grouped by domain (auth, events, etc.).
- `server/controllers`: Request handlers that contain route-level business flow.
- `server/models`: Data models representing PostgreSQL entities.
- `server/middleware`: Shared Express middleware such as JWT auth checks.
- `server/config`: Configuration files such as database connection setup.

## API Naming Conventions

Use RESTful conventions for backend endpoint naming:

- Use plural nouns for resources
- Use `/api` as a global prefix
- Keep URL paths resource-oriented and consistent

Examples:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/events`
- `GET /api/events/:id`
- `POST /api/events/:id/rsvp`
- `GET /api/admin/events/pending`

## Backend Route Mapping

- `/api/auth` -> `authRoutes.js` -> `authController.js`
- `/api/events` -> `eventRoutes.js` -> `eventController.js`
- `/api/events/:id/rsvp` -> `eventRoutes.js` -> `eventController.js`
- `/api/admin` -> `adminRoutes.js` -> `adminController.js`

## Frontend Architecture

### Pages

- `LoginPage`
- `EventListPage`
- `EventDetailPage`
- `DashboardPage`

### Components

- `Navbar`
- `EventCard`
- `RSVPButton`

### Services

- `authService`
- `eventService`

## Where Future Files Should Go

- Add new pages to `client/src/pages`.
- Add reusable UI pieces to `client/src/components`.
- Add API helper modules to `client/src/services`.
- Add additional styles to `client/src/styles`.
- Add new endpoint groups in `server/routes`.
- Add matching handlers in `server/controllers`.
- Add database models in `server/models`.
- Add cross-cutting logic (auth, validation, error handling) in `server/middleware`.
- Add environment and integration configuration files in `server/config`.

## Development Notes

- Keep naming consistent across frontend and backend.
- Follow the folder structure strictly to avoid mixed responsibilities.
- Separate concerns clearly (`routes` vs `controllers` vs frontend `services`).
- Route all frontend API requests through files in `src/services`.
