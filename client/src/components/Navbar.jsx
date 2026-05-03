import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { decodeJwtPayload, getValidStoredToken } from "../utils/decodeJwtPayload";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [hasToken, setHasToken] = useState(() => !!getValidStoredToken());

  const [role, setRole] = useState(() => decodeJwtPayload(localStorage.getItem("token"))?.role ?? null);

  useEffect(() => {
    const t = getValidStoredToken();
    setHasToken(!!t);
    setRole(decodeJwtPayload(t)?.role ?? null);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("eventhubUserName");
    setHasToken(false);
    navigate("/login");
  };

  const linkClass = ({ isActive }) => `nav-link ${isActive ? "nav-link--active" : ""}`;

  return (
    <nav className="top-nav">
      <span className="top-nav__brand">EventHub</span>
      <NavLink to="/events" className={linkClass}>
        Events
      </NavLink>
      {hasToken ? (
        <>
          <NavLink to="/dashboard" className={linkClass}>
            Dashboard
          </NavLink>
          <button type="button" className="nav-btn" onClick={handleLogout}>
            Log out
          </button>
        </>
      ) : (
        <NavLink to="/login" className={({ isActive }) => `nav-link nav-link--push ${isActive ? "nav-link--active" : ""}`}>
          Log in
        </NavLink>
      )}
    </nav>
  );
}
