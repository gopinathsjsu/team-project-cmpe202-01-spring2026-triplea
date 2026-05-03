import { Navigate, Outlet } from "react-router-dom";
import { decodeJwtPayload, getValidStoredToken } from "../utils/decodeJwtPayload";

/** Only users with JWT role `organizer` may access nested routes (Create Event UI). */
export default function OrganizerRoute() {
  const token = getValidStoredToken();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  const role = decodeJwtPayload(token)?.role;
  if (role !== "organizer") {
    return <Navigate to="/events" replace />;
  }
  return <Outlet />;
}
