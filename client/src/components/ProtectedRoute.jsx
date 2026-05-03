import { Navigate, Outlet } from "react-router-dom";
import { getValidStoredToken } from "../utils/decodeJwtPayload";

export default function ProtectedRoute({ children }) {
  const token = getValidStoredToken();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children || <Outlet />;
}
