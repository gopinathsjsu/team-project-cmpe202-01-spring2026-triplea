import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  approveEventById,
  deleteEventById,
  getAllEventsForAdmin,
  getMyEvents,
  getMyRegisteredEvents,
  getPendingEvents,
} from "../services/eventService";
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
  const isAdmin = role === "admin";

  const [createdEvents, setCreatedEvents] = useState([]);
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [allAdminEvents, setAllAdminEvents] = useState([]);
  const [createdLoading, setCreatedLoading] = useState(isOrganizer);
  const [registeredLoading, setRegisteredLoading] = useState(isAttendee);
  const [pendingLoading, setPendingLoading] = useState(isAdmin);
  const [allAdminLoading, setAllAdminLoading] = useState(isAdmin);
  const [createdError, setCreatedError] = useState("");
  const [registeredError, setRegisteredError] = useState("");
  const [pendingError, setPendingError] = useState("");
  const [allAdminError, setAllAdminError] = useState("");

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

  useEffect(() => {
    if (!isAdmin) {
      setPendingLoading(false);
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      setPendingLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setPendingLoading(true);
      setPendingError("");
      try {
        const res = await getPendingEvents(token);
        if (!cancelled) {
          setPendingEvents(Array.isArray(res?.data) ? res.data : []);
        }
      } catch (e) {
        if (!cancelled) {
          setPendingError(e?.message || "Could not load pending events.");
          setPendingEvents([]);
        }
      } finally {
        if (!cancelled) {
          setPendingLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) {
      setAllAdminLoading(false);
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      setAllAdminLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setAllAdminLoading(true);
      setAllAdminError("");
      try {
        const res = await getAllEventsForAdmin(token);
        if (!cancelled) {
          setAllAdminEvents(Array.isArray(res?.data) ? res.data : []);
        }
      } catch (e) {
        if (!cancelled) {
          setAllAdminError(e?.message || "Could not load all events.");
          setAllAdminEvents([]);
        }
      } finally {
        if (!cancelled) {
          setAllAdminLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

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

  if (isAdmin) {
    const token = localStorage.getItem("token");
    const handleApprove = async (eventId) => {
      if (!token) {
        return;
      }
      try {
        await approveEventById(eventId, token);
        setPendingEvents((prev) => prev.filter((ev) => ev.id !== eventId));
      } catch (e) {
        window.alert(e?.message || "Failed to approve event");
      }
    };

    const handleDelete = async (eventId) => {
      if (!token) {
        return;
      }
      const ok = window.confirm("Delete this event?");
      if (!ok) {
        return;
      }
      try {
        await deleteEventById(eventId, token);
        setAllAdminEvents((prev) => prev.filter((ev) => ev.id !== eventId));
        setPendingEvents((prev) => prev.filter((ev) => ev.id !== eventId));
      } catch (e) {
        window.alert(e?.message || "Failed to delete event");
      }
    };

    return (
      <main style={{ display: "grid", gridTemplateColumns: "220px 1fr", minHeight: "calc(100vh - 56px)" }}>
        <aside style={{ borderRight: "1px solid #ddd", padding: "12px", background: "#fcfcfc" }}>
          <h3 style={{ marginTop: 0 }}>Admin</h3>
          <p style={{ margin: "8px 0", fontWeight: 600 }}>Dashboard</p>
          <p style={{ margin: "8px 0 0", fontSize: "14px", color: "#444" }}>
            <a href="#pending-events" style={{ color: "inherit" }}>
              Pending events
            </a>
          </p>
        </aside>

        <section style={{ padding: "16px", display: "grid", gap: "16px" }}>
          <h2 style={{ margin: 0 }}>Welcome back, {userName}!</h2>
          <p style={{ margin: 0, color: "#555" }}>Here are events waiting for approval.</p>

          <div style={{ border: "1px solid #ddd", padding: "12px" }}>
            <h3 id="pending-events" style={{ marginTop: 0, scrollMarginTop: "12px" }}>
              Pending events
            </h3>
            {pendingLoading ? <p style={{ marginTop: 0 }}>Loading pending events…</p> : null}
            {pendingError ? <p style={{ marginTop: 0, color: "#b00020" }}>{pendingError}</p> : null}
            {!pendingLoading && !pendingError ? (
              pendingEvents.length === 0 ? (
                <p style={{ marginTop: 0, color: "#666" }}>No pending events.</p>
              ) : (
                <div style={{ display: "grid", gap: "8px" }}>
                  {pendingEvents.map((ev) => (
                    <div
                      key={ev.id}
                      style={{
                        border: "1px solid #eee",
                        padding: "10px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "start",
                        gap: "12px",
                      }}
                    >
                      <Link to={`/events/${ev.id}`} style={{ textDecoration: "none", color: "inherit", flex: 1 }}>
                        <strong>{ev.title || "Untitled event"}</strong>
                        <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#555" }}>
                          {formatDisplayDate(ev.event_date)}
                          {ev.start_time ? ` · ${ev.start_time}` : ""}
                          {ev.location_name ? ` · ${ev.location_name}` : ""}
                        </p>
                        <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#555" }}>
                          Organizer: {ev.organizer_full_name || `ID ${ev.organizer_id}`}
                        </p>
                      </Link>
                      <button type="button" onClick={() => handleApprove(ev.id)} style={{ padding: "8px 10px" }}>
                        Approve
                      </button>
                    </div>
                  ))}
                </div>
              )
            ) : null}
          </div>

          <div style={{ border: "1px solid #ddd", padding: "12px" }}>
            <h3 style={{ marginTop: 0 }}>All events</h3>
            {allAdminLoading ? <p style={{ marginTop: 0 }}>Loading all events…</p> : null}
            {allAdminError ? <p style={{ marginTop: 0, color: "#b00020" }}>{allAdminError}</p> : null}
            {!allAdminLoading && !allAdminError ? (
              allAdminEvents.length === 0 ? (
                <p style={{ marginTop: 0, color: "#666" }}>No events.</p>
              ) : (
                <div style={{ display: "grid", gap: "8px" }}>
                  {allAdminEvents.map((ev) => (
                    <div
                      key={`all-${ev.id}`}
                      style={{
                        border: "1px solid #eee",
                        padding: "10px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "start",
                        gap: "12px",
                      }}
                    >
                      <Link to={`/events/${ev.id}`} style={{ textDecoration: "none", color: "inherit", flex: 1 }}>
                        <strong>{ev.title || "Untitled event"}</strong>
                        <p style={{ margin: "6px 0 0", fontSize: "13px", color: "#555" }}>
                          {formatDisplayDate(ev.event_date)}
                          {ev.start_time ? ` · ${ev.start_time}` : ""}
                          {ev.location_name ? ` · ${ev.location_name}` : ""}
                        </p>
                        <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#555" }}>
                          Status: {ev.approval_status ?? "—"} · Organizer: {ev.organizer_full_name || `ID ${ev.organizer_id}`}
                        </p>
                      </Link>
                      <button type="button" onClick={() => handleDelete(ev.id)} style={{ padding: "8px 10px" }}>
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )
            ) : null}
          </div>
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
