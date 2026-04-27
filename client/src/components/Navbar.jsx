import { NavLink, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    sessionStorage.removeItem("eventhubUserName");
    navigate("/login");
  };

  return (
    <nav style={{ display: "flex", gap: "12px", padding: "12px", borderBottom: "1px solid #ddd" }}>
      <strong>EventHub</strong>
      <button type="button" onClick={handleLogout} style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer" }}>
        Logout
      </button>
      <NavLink to="/events">Events</NavLink>
      <NavLink to="/dashboard">Dashboard</NavLink>
      <NavLink to="/create-event">Create Event</NavLink>
      <NavLink to="/admin">Admin</NavLink>
    </nav>
  );
}
