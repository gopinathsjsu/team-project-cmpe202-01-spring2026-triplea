import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getMyEvents, getMyRegisteredEvents } from "../services/eventService";
import { decodeJwtPayload } from "../utils/decodeJwtPayload";
import { formatDisplayDate } from "../utils/formatDisplayDate";

function toDateOnly(value) {
  const iso = formatDisplayDate(value);
  if (!iso || iso === "—") {
    return null;
  }
  return new Date(`${iso}T00:00:00`);
}

function splitEventsByToday(events) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = [];
  const past = [];
  for (const ev of events) {
    const d = toDateOnly(ev.event_date);
    if (!d || d >= today) {
      upcoming.push(ev);
    } else {
      past.push(ev);
    }
  }
  return { upcoming, past };
}

export default function DashboardPage() {
  const userName = sessionStorage.getItem("eventhubUserName") || "User";
  const role = decodeJwtPayload(localStorage.getItem("token"))?.role ?? null;
  const isOrganizer = role === "organizer";
  const isAttendee = role === "attendee";

  const [createdEvents, setCreatedEvents] = useState([]);
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [createdLoading, setCreatedLoading] = useState(isOrganizer);
  const [registeredLoading, setRegisteredLoading] = useState(isAttendee);
  const [createdError, setCreatedError] = useState("");
  const [registeredError, setRegisteredError] = useState("");

  useEffect(() => {
    if (!isOrganizer) {
      setCreatedLoading(false);
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      setCreatedLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setCreatedLoading(true);
      setCreatedError("");
      try {
        const res = await getMyEvents(token);
        if (!cancelled) {
          setCreatedEvents(Array.isArray(res?.data) ? res.data : []);
        }
      } catch (e) {
        if (!cancelled) {
          setCreatedError(e?.message || "Could not load your events.");
          setCreatedEvents([]);
        }
      } finally {
        if (!cancelled) {
          setCreatedLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isOrganizer]);

  useEffect(() => {
    if (!isAttendee) {
      setRegisteredLoading(false);
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      setRegisteredLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setRegisteredLoading(true);
      setRegisteredError("");
      try {
        const res = await getMyRegisteredEvents(token);
        if (!cancelled) {
          setRegisteredEvents(Array.isArray(res?.data) ? res.data : []);
        }
      } catch (e) {
        if (!cancelled) {
          setRegisteredError(e?.message || "Could not load your registrations.");
          setRegisteredEvents([]);
        }
      } finally {
        if (!cancelled) {
          setRegisteredLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAttendee]);

  const createdSplit = useMemo(() => splitEventsByToday(createdEvents), [createdEvents]);
  const registeredSplit = useMemo(() => splitEventsByToday(registeredEvents), [registeredEvents]);

  const renderEventRows = (list) => {
    if (list.length === 0) {
      return <p style={{ marginTop: 0, color: "#666" }}>No events.</p>;
    }
    return (
      <div style={{ display: "grid", gap: "8px" }}>
        {list.map((ev) => (
          <Link
            key={ev.id}
            to={`/events/${ev.id}`}
            style={{
              display: "block",
              border: "1px solid #eee",
              padding: "10px",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <strong>{ev.title || "Untitled event"}</strong>
            <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#555" }}>
              {formatDisplayDate(ev.event_date)}
              {ev.start_time ? ` · ${ev.start_time}` : ""}
              {ev.location_name ? ` · ${ev.location_name}` : ""}
            </p>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#555" }}>
              Approval: {ev.approval_status ?? "—"}
            </p>
          </Link>
        ))}
      </div>
    );
  };

  if (isOrganizer) {
    const { upcoming, past } = createdSplit;
    return (
      <main style={{ display: "grid", gridTemplateColumns: "220px 1fr", minHeight: "calc(100vh - 56px)" }}>
        <aside style={{ borderRight: "1px solid #ddd", padding: "12px", background: "#fcfcfc" }}>
          <h3 style={{ marginTop: 0 }}>Dashboard</h3>
          <p style={{ margin: "8px 0", fontWeight: 600 }}>Overview</p>
          <p style={{ margin: "8px 0 0", fontSize: "14px", color: "#444" }}>
            <a href="#my-upcoming" style={{ color: "inherit" }}>
              Upcoming events
            </a>
          </p>
          <p style={{ margin: "8px 0 0", fontSize: "14px", color: "#444" }}>
            <a href="#my-past" style={{ color: "inherit" }}>
              Past events
            </a>
          </p>
        </aside>

        <section style={{ padding: "16px", display: "grid", gap: "16px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ margin: 0 }}>Welcome back, {userName}!</h2>
            <Link
              to="/create-event"
              style={{ border: "1px solid #bbb", padding: "8px 14px", textDecoration: "none", color: "inherit", fontSize: "14px" }}
            >
              Create Event
            </Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "10px" }}>
            <div style={{ border: "1px solid #ddd", padding: "10px" }}>Total events: {createdEvents.length}</div>
            <div style={{ border: "1px solid #ddd", padding: "10px" }}>Upcoming: {upcoming.length}</div>
            <div style={{ border: "1px solid #ddd", padding: "10px" }}>Past: {past.length}</div>
          </div>

          {createdLoading ? <p style={{ margin: 0 }}>Loading your events…</p> : null}
          {createdError ? <p style={{ margin: 0, color: "#b00020" }}>{createdError}</p> : null}

          <section id="my-upcoming" style={{ border: "1px solid #ddd", padding: "12px", scrollMarginTop: "12px" }}>
            <h3 style={{ marginTop: 0 }}>Upcoming events</h3>
            <p style={{ marginTop: 0, fontSize: "14px", color: "#555" }}>Events you created with today&apos;s date or later.</p>
            {!createdLoading ? renderEventRows(upcoming) : null}
          </section>

          <section id="my-past" style={{ border: "1px solid #ddd", padding: "12px", scrollMarginTop: "12px" }}>
            <h3 style={{ marginTop: 0 }}>Past events</h3>
            <p style={{ marginTop: 0, fontSize: "14px", color: "#555" }}>Events you created before today.</p>
            {!createdLoading ? renderEventRows(past) : null}
          </section>
        </section>
      </main>
    );
  }

  if (isAttendee) {
    const { upcoming, past } = registeredSplit;
    return (
      <main style={{ display: "grid", gridTemplateColumns: "220px 1fr", minHeight: "calc(100vh - 56px)" }}>
        <aside style={{ borderRight: "1px solid #ddd", padding: "12px", background: "#fcfcfc" }}>
          <h3 style={{ marginTop: 0 }}>Dashboard</h3>
          <p style={{ margin: "8px 0", fontWeight: 600 }}>Your RSVPs</p>
          <p style={{ margin: "8px 0 0", fontSize: "14px", color: "#444" }}>
            <a href="#reg-upcoming" style={{ color: "inherit" }}>
              Upcoming
            </a>
          </p>
          <p style={{ margin: "8px 0 0", fontSize: "14px", color: "#444" }}>
            <a href="#reg-past" style={{ color: "inherit" }}>
              Past
            </a>
          </p>
          <p style={{ margin: "14px 0 0", fontSize: "14px" }}>
            <Link to="/events">Browse more events</Link>
          </p>
        </aside>

        <section style={{ padding: "16px", display: "grid", gap: "16px" }}>
          <h2 style={{ margin: 0 }}>Welcome back, {userName}!</h2>
          <p style={{ margin: 0, color: "#555" }}>Below are events you are currently registered for (active RSVPs).</p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "10px" }}>
            <div style={{ border: "1px solid #ddd", padding: "10px" }}>Total registrations: {registeredEvents.length}</div>
            <div style={{ border: "1px solid #ddd", padding: "10px" }}>Upcoming: {upcoming.length}</div>
            <div style={{ border: "1px solid #ddd", padding: "10px" }}>Past: {past.length}</div>
          </div>

          {registeredLoading ? <p style={{ margin: 0 }}>Loading your registrations…</p> : null}
          {registeredError ? <p style={{ margin: 0, color: "#b00020" }}>{registeredError}</p> : null}

          <section id="reg-upcoming" style={{ border: "1px solid #ddd", padding: "12px", scrollMarginTop: "12px" }}>
            <h3 style={{ marginTop: 0 }}>Upcoming events</h3>
            <p style={{ marginTop: 0, fontSize: "14px", color: "#555" }}>Registered events dated today or later.</p>
            {!registeredLoading ? renderEventRows(upcoming) : null}
          </section>

          <section id="reg-past" style={{ border: "1px solid #ddd", padding: "12px", scrollMarginTop: "12px" }}>
            <h3 style={{ marginTop: 0 }}>Past events</h3>
            <p style={{ marginTop: 0, fontSize: "14px", color: "#555" }}>Registered events dated before today.</p>
            {!registeredLoading ? renderEventRows(past) : null}
          </section>
        </section>
      </main>
    );
  }

  return (
    <main style={{ display: "grid", gridTemplateColumns: "220px 1fr", minHeight: "calc(100vh - 56px)" }}>
      <aside style={{ borderRight: "1px solid #ddd", padding: "12px", background: "#fcfcfc" }}>
        <h3>EventHub</h3>
        <p>Dashboard</p>
        <p>
          <Link to="/events" style={{ color: "inherit" }}>
            Browse events
          </Link>
        </p>
        <p>Profile</p>
        <p>Settings</p>
      </aside>

      <section style={{ padding: "16px", display: "grid", gap: "12px" }}>
        <h2>Welcome back, {userName}!</h2>
        <p style={{ margin: 0 }}>Explore public listings under Events.</p>
        <section style={{ border: "1px solid #ddd", padding: "12px" }}>
          <h3 style={{ marginTop: 0 }}>Explore</h3>
          <p style={{ margin: 0, color: "#666" }}>
            Open <Link to="/events">Events</Link>.
          </p>
        </section>
      </section>
    </main>
  );
}
