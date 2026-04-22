# EventHub SJSU - Project Structure

This project is organized into two main applications:

- `client`: Frontend React application (UI, pages, components, styling, API calls).
- `server`: Backend Node.js + Express API (routes, controllers, models, middleware, config).

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

## Frontend/Backend Separation

- Keep all user interface code inside `client`.
- Keep all API and data access code inside `server`.
- The frontend should communicate with the backend through HTTP requests only.

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
