import { Navigate, Outlet } from "react-router-dom";
import { decodeJwtPayload } from "../utils/decodeJwtPayload";

/** Only users with JWT role `admin` may access nested routes. */
export default function AdminRoute() {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  const role = decodeJwtPayload(token)?.role;
  if (role !== "admin") {
    return <Navigate to="/events" replace />;
  }
  return <Outlet />;
}
