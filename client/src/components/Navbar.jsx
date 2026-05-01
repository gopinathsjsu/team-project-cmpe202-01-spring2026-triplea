import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { decodeJwtPayload } from "../utils/decodeJwtPayload";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [hasToken, setHasToken] = useState(() => !!localStorage.getItem("token"));

  const [role, setRole] = useState(() => decodeJwtPayload(localStorage.getItem("token"))?.role ?? null);

  useEffect(() => {
    const t = localStorage.getItem("token");
    setHasToken(!!t);
    setRole(decodeJwtPayload(t)?.role ?? null);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("eventhubUserName");
    setHasToken(false);
    navigate("/login");
  };

  return (
    <nav style={{ display: "flex", gap: "12px", alignItems: "center", padding: "12px", borderBottom: "1px solid #ddd" }}>
      <strong>EventHub</strong>
      <NavLink to="/events">Events</NavLink>
      {hasToken ? (
        <>
          <NavLink to="/dashboard">Dashboard</NavLink>
          {role === "admin" ? <NavLink to="/admin">Admin</NavLink> : null}
          <button
            type="button"
            onClick={handleLogout}
            style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", marginLeft: "auto" }}
          >
            Logout
          </button>
        </>
      ) : (
        <NavLink to="/login" style={{ marginLeft: "auto" }}>
          Login
        </NavLink>
      )}
    </nav>
  );
}
