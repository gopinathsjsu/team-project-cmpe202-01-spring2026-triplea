import { NavLink } from "react-router-dom";

export default function Navbar() {
  return (
    <nav style={{ display: "flex", gap: "12px", padding: "12px", borderBottom: "1px solid #ddd" }}>
      <strong>EventHub</strong>
      <NavLink to="/login">Login</NavLink>
      <NavLink to="/events">Events</NavLink>
      <NavLink to="/dashboard">Dashboard</NavLink>
      <NavLink to="/create-event">Create Event</NavLink>
      <NavLink to="/admin">Admin</NavLink>
    </nav>
  );
}
