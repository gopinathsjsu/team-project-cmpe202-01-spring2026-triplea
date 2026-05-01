import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [hasToken, setHasToken] = useState(() => !!localStorage.getItem("token"));

  useEffect(() => {
    setHasToken(!!localStorage.getItem("token"));
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
          <NavLink to="/create-event">Create Event</NavLink>
          <NavLink to="/admin">Admin</NavLink>
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
