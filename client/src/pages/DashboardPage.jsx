import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  approveEventById,
  approveEventUpdateById,
  deleteEventById,
  getAllEventsForAdmin,
  getMyEvents,
  getMyRejectedEventUpdates,
  getMyRegisteredEvents,
  getPendingEvents,
  getPendingEventUpdates,
  rejectEventById,
  rejectEventUpdateById,
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
  const [rejectedEventUpdates, setRejectedEventUpdates] = useState([]);
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [pendingEventUpdates, setPendingEventUpdates] = useState([]);
  const [allAdminEvents, setAllAdminEvents] = useState([]);
  const [createdLoading, setCreatedLoading] = useState(isOrganizer);
  const [rejectedUpdatesLoading, setRejectedUpdatesLoading] = useState(isOrganizer);
  const [registeredLoading, setRegisteredLoading] = useState(isAttendee);
  const [pendingLoading, setPendingLoading] = useState(isAdmin);
  const [pendingUpdatesLoading, setPendingUpdatesLoading] = useState(isAdmin);
  const [allAdminLoading, setAllAdminLoading] = useState(isAdmin);
  const [createdError, setCreatedError] = useState("");
  const [rejectedUpdatesError, setRejectedUpdatesError] = useState("");
  const [registeredError, setRegisteredError] = useState("");
  const [pendingError, setPendingError] = useState("");
  const [pendingUpdatesError, setPendingUpdatesError] = useState("");
  const [allAdminError, setAllAdminError] = useState("");
  const [rejectingEventId, setRejectingEventId] = useState(null);
  const [rejectCommentDraft, setRejectCommentDraft] = useState("");
  const [rejectingUpdateId, setRejectingUpdateId] = useState(null);
  const [rejectUpdateCommentDraft, setRejectUpdateCommentDraft] = useState("");
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

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
    if (!isOrganizer) {
      setRejectedUpdatesLoading(false);
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      setRejectedUpdatesLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setRejectedUpdatesLoading(true);
      setRejectedUpdatesError("");
      try {
        const res = await getMyRejectedEventUpdates(token);
        if (!cancelled) {
          setRejectedEventUpdates(Array.isArray(res?.data) ? res.data : []);
        }
      } catch (e) {
        if (!cancelled) {
          setRejectedUpdatesError(e?.message || "Could not load rejected event updates.");
          setRejectedEventUpdates([]);
        }
      } finally {
        if (!cancelled) {
          setRejectedUpdatesLoading(false);
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
      setPendingUpdatesLoading(false);
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      setPendingUpdatesLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setPendingUpdatesLoading(true);
      setPendingUpdatesError("");
      try {
        const res = await getPendingEventUpdates(token);
        if (!cancelled) {
          setPendingEventUpdates(Array.isArray(res?.data) ? res.data : []);
        }
      } catch (e) {
        if (!cancelled) {
          setPendingUpdatesError(e?.message || "Could not load pending event updates.");
          setPendingEventUpdates([]);
        }
      } finally {
        if (!cancelled) {
          setPendingUpdatesLoading(false);
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

  const organizerPendingEvents = useMemo(
    () => createdEvents.filter((ev) => ev.approval_status === "pending"),
    [createdEvents]
  );
  const organizerEventsForUpcomingPast = useMemo(
    () =>
      createdEvents.filter(
        (ev) =>
          ev.approval_status !== "rejected" && ev.approval_status !== "pending"
      ),
    [createdEvents]
  );
  const organizerDisapprovedEvents = useMemo(
    () => createdEvents.filter((ev) => ev.approval_status === "rejected"),
    [createdEvents]
  );
  const createdSplit = useMemo(() => splitEventsByToday(organizerEventsForUpcomingPast), [organizerEventsForUpcomingPast]);
  const registeredSplit = useMemo(() => splitEventsByToday(registeredEvents), [registeredEvents]);

  const adminDisapprovedEvents = useMemo(
    () => allAdminEvents.filter((ev) => ev.approval_status === "rejected"),
    [allAdminEvents]
  );

  const renderEventRows = (list, options = {}) => {
    const { showRejectedReason = false, showApprovalStatus = true } = options;
    if (list.length === 0) {
      return <p className="text-muted" role="status">No events.</p>;
    }
    return (
      <div style={{ display: "grid", gap: "0.5rem" }}>
        {list.map((ev) => (
          <Link key={ev.id} to={`/events/${ev.id}`} className="dash-event-link">
            <strong>{ev.title || "Untitled event"}</strong>
            <p className="text-muted" style={{ margin: "0.35rem 0 0", fontSize: "0.8125rem" }}>
              {formatDisplayDate(ev.event_date)}
              {ev.start_time ? ` · ${ev.start_time}` : ""}
              {ev.location_name ? ` · ${ev.location_name}` : ""}
            </p>
            {showApprovalStatus ? (
              <p className="text-muted" style={{ margin: "0.25rem 0 0", fontSize: "0.8125rem" }}>
                Approval: {ev.approval_status ?? "—"}
              </p>
            ) : null}
            {showRejectedReason && ev.approval_status === "rejected" && ev.rejection_reason?.trim() ? (
              <p className="text-error" role="status" style={{ margin: "0.5rem 0 0", fontSize: "0.8125rem", whiteSpace: "pre-wrap" }}>
                <strong>Admin note:</strong> {ev.rejection_reason.trim()}
              </p>
            ) : null}
          </Link>
        ))}
      </div>
    );
  };

  const renderRejectedUpdateRows = (list) => {
    if (list.length === 0) {
      return <p className="text-muted" role="status">No disapproved event updates.</p>;
    }
    return (
      <div style={{ display: "grid", gap: "0.5rem" }}>
        {list.map((req) => (
          <Link key={req.update_request_id} to={`/events/${req.event_id}`} className="dash-event-link">
            <strong>{req.proposed_title || req.current_title || "Untitled event"}</strong>
            <p className="text-muted" style={{ margin: "0.35rem 0 0", fontSize: "0.8125rem" }}>
              Current event: {req.current_title || "Untitled event"}
            </p>
            <p className="text-muted" style={{ margin: "0.25rem 0 0", fontSize: "0.8125rem" }}>
              Proposed date: {formatDisplayDate(req.proposed_event_date || req.current_event_date)}
              {req.proposed_start_time ? ` · ${req.proposed_start_time}` : ""}
              {req.proposed_location_name ? ` · ${req.proposed_location_name}` : ""}
            </p>
            {req.rejection_reason?.trim() ? (
              <p className="text-error" role="status" style={{ margin: "0.5rem 0 0", fontSize: "0.8125rem", whiteSpace: "pre-wrap" }}>
                <strong>Admin note:</strong> {req.rejection_reason.trim()}
              </p>
            ) : null}
          </Link>
        ))}
      </div>
    );
  };

  if (isOrganizer) {
    const { upcoming, past } = createdSplit;
    return (
      <main className="dash-layout">
        <aside className="dash-sidebar">
          <h3 style={{ marginTop: 0 }}>Dashboard</h3>
          <p style={{ margin: "8px 0", fontWeight: 600 }}>Overview</p>
          <p style={{ margin: "8px 0 0", fontSize: "14px", color: "#444" }}>
            <a href="#my-pending" style={{ color: "inherit" }}>
              Pending events
            </a>
          </p>
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
          <p style={{ margin: "8px 0 0", fontSize: "14px", color: "#444" }}>
            <a href="#my-disapproved" style={{ color: "inherit" }}>
              Disapproved events
            </a>
          </p>
          <p style={{ margin: "8px 0 0", fontSize: "14px", color: "#444" }}>
            <a href="#my-disapproved-updates" style={{ color: "inherit" }}>
              Disapproved updates
            </a>
          </p>
        </aside>

        <section className="dash-content">
          <div className="page-header">
            <h1 className="page-title" style={{ fontSize: "1.35rem" }}>
              Welcome back, {userName}!
            </h1>
            <Link to="/create-event" className="btn btn-primary">
              Create event
            </Link>
          </div>

          <div className="dash-stat-grid dash-stat-grid--5">
            <div className="dash-stat">Total events: {createdEvents.length}</div>
            <div className="dash-stat">Pending: {organizerPendingEvents.length}</div>
            <div className="dash-stat">Upcoming: {upcoming.length}</div>
            <div className="dash-stat">Past: {past.length}</div>
            <div className="dash-stat">Disapproved: {organizerDisapprovedEvents.length}</div>
          </div>

          {createdLoading ? <p className="text-muted" role="status" aria-live="polite">Loading your events…</p> : null}
          {createdError ? <p className="text-error" role="alert">{createdError}</p> : null}

          <section id="my-pending" className="card card-pad dash-section">
            <h3 className="page-title" style={{ fontSize: "1.1rem", marginBottom: "0.35rem" }}>
              Pending events
            </h3>
            <p className="page-lede">Waiting for an admin to approve or disapprove.</p>
            {!createdLoading ? renderEventRows(organizerPendingEvents) : null}
          </section>

          <section id="my-upcoming" className="card card-pad dash-section">
            <h3 className="page-title" style={{ fontSize: "1.1rem", marginBottom: "0.35rem" }}>
              Upcoming events
            </h3>
            <p className="page-lede">
              Approved events you created with today&apos;s date or later (RSVP opens after approval).
            </p>
            {!createdLoading ? renderEventRows(upcoming) : null}
          </section>

          <section id="my-past" className="card card-pad dash-section">
            <h3 className="page-title" style={{ fontSize: "1.1rem", marginBottom: "0.35rem" }}>
              Past events
            </h3>
            <p className="page-lede">Approved events you created before today.</p>
            {!createdLoading ? renderEventRows(past) : null}
          </section>

          <section id="my-disapproved" className="card card-pad dash-section">
            <h3 className="page-title" style={{ fontSize: "1.1rem", marginBottom: "0.35rem" }}>
              Disapproved events
            </h3>
            <p className="page-lede">Events an admin marked as rejected. They are hidden from the public list.</p>
            {!createdLoading ? renderEventRows(organizerDisapprovedEvents, { showRejectedReason: true }) : null}
          </section>

          <section id="my-disapproved-updates" className="card card-pad dash-section">
            <h3 className="page-title" style={{ fontSize: "1.1rem", marginBottom: "0.35rem" }}>
              Disapproved event updates
            </h3>
            <p className="page-lede">Edits to approved events that an admin rejected. The live event still uses the approved details.</p>
            {rejectedUpdatesLoading ? <p className="text-muted" role="status" aria-live="polite">Loading disapproved updates…</p> : null}
            {rejectedUpdatesError ? <p className="text-error" role="alert">{rejectedUpdatesError}</p> : null}
            {!rejectedUpdatesLoading && !rejectedUpdatesError ? renderRejectedUpdateRows(rejectedEventUpdates) : null}
          </section>
        </section>
      </main>
    );
  }

  if (isAttendee) {
    const { upcoming, past } = registeredSplit;
    return (
      <main className="dash-layout">
        <aside className="dash-sidebar">
          <h3 style={{ marginTop: 0 }}>Dashboard</h3>
          <p style={{ margin: "8px 0", fontWeight: 600 }}>Your RSVPs</p>
          <p style={{ margin: "8px 0 0", fontSize: "14px", color: "#444" }}>
            <a href="#reg-upcoming" style={{ color: "inherit" }}>
              Upcoming
            </a>
          </p>
          <p style={{ margin: "8px 0 0", fontSize: "14px", color: "#444" }}>
            <a href="#reg-past" style={{ color: "inherit" }}>
              Past events
            </a>
          </p>
          <p style={{ margin: "14px 0 0", fontSize: "14px" }}>
            <Link to="/events">Browse current events</Link>
          </p>
        </aside>

        <section className="dash-content">
          <h1 className="page-title" style={{ fontSize: "1.35rem" }}>
            Welcome back, {userName}!
          </h1>
          <p className="page-lede">
            Events you are registered for (active RSVPs). Past registrations are listed in Past events below.
          </p>

          <div className="dash-stat-grid dash-stat-grid--3">
            <div className="dash-stat">Registrations: {registeredEvents.length}</div>
            <div className="dash-stat">Upcoming: {upcoming.length}</div>
            <div className="dash-stat">Past: {past.length}</div>
          </div>

          {registeredLoading ? <p className="text-muted" role="status" aria-live="polite">Loading your registrations…</p> : null}
          {registeredError ? <p className="text-error" role="alert">{registeredError}</p> : null}

          <section id="reg-upcoming" className="card card-pad dash-section">
            <h3 className="page-title" style={{ fontSize: "1.1rem", marginBottom: "0.35rem" }}>
              Upcoming events
            </h3>
            <p className="page-lede">Registered events dated today or later.</p>
            {!registeredLoading ? renderEventRows(upcoming, { showApprovalStatus: false }) : null}
          </section>

          <section id="reg-past" className="card card-pad dash-section">
            <h3 className="page-title" style={{ fontSize: "1.1rem", marginBottom: "0.35rem" }}>
              Past events
            </h3>
            <p className="page-lede">Registered events dated before today.</p>
            {!registeredLoading ? renderEventRows(past, { showApprovalStatus: false }) : null}
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
        setAllAdminEvents((prev) =>
          prev.map((ev) =>
            ev.id === eventId ? { ...ev, approval_status: "approved", rejection_reason: null } : ev
          )
        );
        if (eventId === rejectingEventId) {
          setRejectingEventId(null);
          setRejectCommentDraft("");
        }
      } catch (e) {
        window.alert(e?.message || "Failed to approve event");
      }
    };

    const submitDisapprovalForEvent = async (eventId) => {
      if (!token) {
        return;
      }
      const trimmed = rejectCommentDraft.trim();
      if (!trimmed) {
        window.alert("Rejection comment is required.");
        return;
      }
      setRejectSubmitting(true);
      try {
        const response = await rejectEventById(eventId, token, { rejection_reason: trimmed });
        const saved = response?.data;
        setPendingEvents((prev) => prev.filter((ev) => ev.id !== eventId));
        setAllAdminEvents((prev) =>
          prev.map((ev) =>
            ev.id === eventId
              ? {
                  ...ev,
                  approval_status: "rejected",
                  rejection_reason: saved?.rejection_reason ?? trimmed,
                }
              : ev
          )
        );
        setRejectingEventId(null);
        setRejectCommentDraft("");
      } catch (e) {
        window.alert(e?.message || "Failed to disapprove event");
      } finally {
        setRejectSubmitting(false);
      }
    };

    const handleApproveUpdate = async (requestId) => {
      if (!token) {
        return;
      }
      try {
        const response = await approveEventUpdateById(requestId, token);
        const saved = response?.data;
        setPendingEventUpdates((prev) => prev.filter((req) => req.update_request_id !== requestId));
        if (saved?.id != null) {
          setAllAdminEvents((prev) =>
            prev.map((ev) =>
              ev.id === saved.id ? { ...ev, ...saved, approval_status: "approved", rejection_reason: null } : ev
            )
          );
        }
        if (requestId === rejectingUpdateId) {
          setRejectingUpdateId(null);
          setRejectUpdateCommentDraft("");
        }
      } catch (e) {
        window.alert(e?.message || "Failed to approve event update");
      }
    };

    const submitDisapprovalForUpdate = async (requestId) => {
      if (!token) {
        return;
      }
      const trimmed = rejectUpdateCommentDraft.trim();
      if (!trimmed) {
        window.alert("Rejection comment is required.");
        return;
      }
      setRejectSubmitting(true);
      try {
        await rejectEventUpdateById(requestId, token, { rejection_reason: trimmed });
        setPendingEventUpdates((prev) => prev.filter((req) => req.update_request_id !== requestId));
        setRejectingUpdateId(null);
        setRejectUpdateCommentDraft("");
      } catch (e) {
        window.alert(e?.message || "Failed to disapprove event update");
      } finally {
        setRejectSubmitting(false);
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
        setPendingEventUpdates((prev) => prev.filter((req) => req.event_id !== eventId));
      } catch (e) {
        window.alert(e?.message || "Failed to delete event");
      }
    };

    return (
      <main className="dash-layout">
        <aside className="dash-sidebar">
          <h3 style={{ marginTop: 0 }}>Admin</h3>
          <p style={{ margin: "8px 0", fontWeight: 600 }}>Dashboard</p>
          <p style={{ margin: "8px 0 0", fontSize: "14px", color: "#444" }}>
            <a href="#pending-events" style={{ color: "inherit" }}>
              Pending events
            </a>
          </p>
          <p style={{ margin: "8px 0 0", fontSize: "14px", color: "#444" }}>
            <a href="#pending-event-updates" style={{ color: "inherit" }}>
              Pending updates
            </a>
          </p>
          <p style={{ margin: "8px 0 0", fontSize: "14px", color: "#444" }}>
            <a href="#disapproved-events-admin" style={{ color: "inherit" }}>
              Disapproved events
            </a>
          </p>
        </aside>

        <section className="dash-content">
          <h1 className="page-title" style={{ fontSize: "1.35rem" }}>
            Welcome back, {userName}!
          </h1>
          <p className="page-lede">Events waiting for your approval.</p>

          <div className="card card-pad dash-section">
            <h3 id="pending-events" className="page-title" style={{ fontSize: "1.1rem", marginBottom: "0.35rem" }}>
              Pending events
            </h3>
            {pendingLoading ? <p className="text-muted" role="status" aria-live="polite">Loading pending events…</p> : null}
            {pendingError ? <p className="text-error" role="alert">{pendingError}</p> : null}
            {!pendingLoading && !pendingError ? (
              pendingEvents.length === 0 ? (
                <p className="text-muted" role="status">No pending events.</p>
              ) : (
                <div style={{ display: "grid", gap: "0.5rem" }}>
                  {pendingEvents.map((ev) => (
                    <div key={ev.id} className="dash-event-row">
                      <div className="dash-event-row__top">
                        <Link to={`/events/${ev.id}`} style={{ textDecoration: "none", color: "inherit", flex: 1 }}>
                          <strong>{ev.title || "Untitled event"}</strong>
                          <p className="text-muted" style={{ margin: "0.35rem 0 0", fontSize: "0.8125rem" }}>
                            {formatDisplayDate(ev.event_date)}
                            {ev.start_time ? ` · ${ev.start_time}` : ""}
                            {ev.location_name ? ` · ${ev.location_name}` : ""}
                          </p>
                          <p className="text-muted" style={{ margin: "0.25rem 0 0", fontSize: "0.8125rem" }}>
                            Organizer: {ev.organizer_full_name || `ID ${ev.organizer_id}`}
                          </p>
                        </Link>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", flexShrink: 0 }}>
                          <button type="button" className="btn btn-primary" onClick={() => handleApprove(ev.id)}>
                            Approve
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => {
                              setRejectingEventId(ev.id);
                              setRejectCommentDraft("");
                            }}
                            disabled={rejectSubmitting}
                          >
                            Disapprove
                          </button>
                        </div>
                      </div>
                      {rejectingEventId === ev.id ? (
                        <div className="detail-actions" style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem" }}>
                          <label htmlFor={`reject-event-${ev.id}`} className="label" style={{ fontSize: "0.8125rem" }}>
                            Comment for organizer (required)
                          </label>
                          <textarea
                            id={`reject-event-${ev.id}`}
                            className="input textarea"
                            value={rejectCommentDraft}
                            onChange={(e) => setRejectCommentDraft(e.target.value)}
                            rows={4}
                            placeholder="Briefly explain why this event was disapproved…"
                          />
                          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                            <button
                              type="button"
                              className="btn btn-danger"
                              disabled={rejectSubmitting}
                              onClick={() => submitDisapprovalForEvent(ev.id)}
                            >
                              {rejectSubmitting ? "Submitting…" : "Submit disapproval"}
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost"
                              disabled={rejectSubmitting}
                              onClick={() => {
                                setRejectingEventId(null);
                                setRejectCommentDraft("");
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )
            ) : null}
          </div>

          <div id="pending-event-updates" className="card card-pad dash-section">
            <h3 className="page-title" style={{ fontSize: "1.1rem", marginBottom: "0.35rem" }}>
              Pending event updates
            </h3>
            <p className="page-lede">Edits to already approved events. The old approved details stay public until approval.</p>
            {pendingUpdatesLoading ? <p className="text-muted" role="status" aria-live="polite">Loading pending updates…</p> : null}
            {pendingUpdatesError ? <p className="text-error" role="alert">{pendingUpdatesError}</p> : null}
            {!pendingUpdatesLoading && !pendingUpdatesError ? (
              pendingEventUpdates.length === 0 ? (
                <p className="text-muted" role="status">No pending event updates.</p>
              ) : (
                <div style={{ display: "grid", gap: "0.5rem" }}>
                  {pendingEventUpdates.map((req) => (
                    <div key={req.update_request_id} className="dash-event-row">
                      <div className="dash-event-row__top">
                        <Link to={`/events/${req.event_id}`} style={{ textDecoration: "none", color: "inherit", flex: 1 }}>
                          <strong>{req.proposed_title || req.current_title || "Untitled event"}</strong>
                          <p className="text-muted" style={{ margin: "0.35rem 0 0", fontSize: "0.8125rem" }}>
                            Current: {req.current_title || "Untitled event"}
                          </p>
                          <p className="text-muted" style={{ margin: "0.25rem 0 0", fontSize: "0.8125rem" }}>
                            Proposed date: {formatDisplayDate(req.proposed_event_date || req.current_event_date)}
                            {req.proposed_start_time ? ` · ${req.proposed_start_time}` : ""}
                            {req.proposed_location_name ? ` · ${req.proposed_location_name}` : ""}
                          </p>
                          <p className="text-muted" style={{ margin: "0.25rem 0 0", fontSize: "0.8125rem" }}>
                            Organizer: {req.organizer_full_name || `ID ${req.requested_by}`}
                          </p>
                        </Link>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", flexShrink: 0 }}>
                          <button type="button" className="btn btn-primary" onClick={() => handleApproveUpdate(req.update_request_id)}>
                            Approve update
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => {
                              setRejectingUpdateId(req.update_request_id);
                              setRejectUpdateCommentDraft("");
                            }}
                            disabled={rejectSubmitting}
                          >
                            Disapprove
                          </button>
                        </div>
                      </div>
                      {rejectingUpdateId === req.update_request_id ? (
                        <div className="detail-actions" style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem" }}>
                          <label htmlFor={`reject-update-${req.update_request_id}`} className="label" style={{ fontSize: "0.8125rem" }}>
                            Comment for organizer (required)
                          </label>
                          <textarea
                            id={`reject-update-${req.update_request_id}`}
                            className="input textarea"
                            value={rejectUpdateCommentDraft}
                            onChange={(e) => setRejectUpdateCommentDraft(e.target.value)}
                            rows={4}
                            placeholder="Briefly explain why this update was disapproved…"
                          />
                          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                            <button
                              type="button"
                              className="btn btn-danger"
                              disabled={rejectSubmitting}
                              onClick={() => submitDisapprovalForUpdate(req.update_request_id)}
                            >
                              {rejectSubmitting ? "Submitting…" : "Submit disapproval"}
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost"
                              disabled={rejectSubmitting}
                              onClick={() => {
                                setRejectingUpdateId(null);
                                setRejectUpdateCommentDraft("");
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )
            ) : null}
          </div>

          <div id="disapproved-events-admin" className="card card-pad dash-section">
            <h3 className="page-title" style={{ fontSize: "1.1rem", marginBottom: "0.35rem" }}>
              Disapproved events
            </h3>
            <p className="page-lede">Submissions that were rejected.</p>
            {allAdminLoading ? <p className="text-muted" role="status" aria-live="polite">Loading…</p> : null}
            {allAdminError ? <p className="text-error" role="alert">{allAdminError}</p> : null}
            {!allAdminLoading && !allAdminError ? (
              adminDisapprovedEvents.length === 0 ? (
                <p className="text-muted" role="status">No disapproved events.</p>
              ) : (
                <div style={{ display: "grid", gap: "0.5rem" }}>
                  {adminDisapprovedEvents.map((ev) => (
                    <Link key={`rej-${ev.id}`} to={`/events/${ev.id}`} className="dash-event-link">
                      <strong>{ev.title || "Untitled event"}</strong>
                      <p className="text-muted" style={{ margin: "0.35rem 0 0", fontSize: "0.8125rem" }}>
                        {formatDisplayDate(ev.event_date)}
                        {ev.start_time ? ` · ${ev.start_time}` : ""}
                        {ev.location_name ? ` · ${ev.location_name}` : ""}
                      </p>
                      <p className="text-muted" style={{ margin: "0.25rem 0 0", fontSize: "0.8125rem" }}>
                        Organizer: {ev.organizer_full_name || `ID ${ev.organizer_id}`}
                      </p>
                      {ev.rejection_reason?.trim() ? (
                        <p className="text-muted" style={{ margin: "0.5rem 0 0", fontSize: "0.8125rem", whiteSpace: "pre-wrap" }}>
                          <strong>Reason recorded:</strong> {ev.rejection_reason.trim()}
                        </p>
                      ) : null}
                    </Link>
                  ))}
                </div>
              )
            ) : null}
          </div>

          <div className="card card-pad dash-section">
            <h3 className="page-title" style={{ fontSize: "1.1rem", marginBottom: "0.35rem" }}>
              All events
            </h3>
            {allAdminLoading ? <p className="text-muted" role="status" aria-live="polite">Loading all events…</p> : null}
            {allAdminError ? <p className="text-error" role="alert">{allAdminError}</p> : null}
            {!allAdminLoading && !allAdminError ? (
              allAdminEvents.length === 0 ? (
                <p className="text-muted" role="status">No events.</p>
              ) : (
                <div style={{ display: "grid", gap: "0.5rem" }}>
                  {allAdminEvents.map((ev) => (
                    <div key={`all-${ev.id}`} className="dash-event-row">
                      <div className="dash-event-row__top">
                        <Link to={`/events/${ev.id}`} style={{ textDecoration: "none", color: "inherit", flex: 1 }}>
                          <strong>{ev.title || "Untitled event"}</strong>
                          <p className="text-muted" style={{ margin: "0.35rem 0 0", fontSize: "0.8125rem" }}>
                            {formatDisplayDate(ev.event_date)}
                            {ev.start_time ? ` · ${ev.start_time}` : ""}
                            {ev.location_name ? ` · ${ev.location_name}` : ""}
                          </p>
                          <p className="text-muted" style={{ margin: "0.25rem 0 0", fontSize: "0.8125rem" }}>
                            Status: {ev.approval_status ?? "—"} · Organizer: {ev.organizer_full_name || `ID ${ev.organizer_id}`}
                          </p>
                        </Link>
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", flexShrink: 0 }}>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => {
                              setRejectingEventId(`all-${ev.id}`);
                              setRejectCommentDraft("");
                            }}
                            disabled={rejectSubmitting || ev.approval_status === "rejected"}
                          >
                            {ev.approval_status === "rejected" ? "Disapproved" : "Disapprove"}
                          </button>
                          <button type="button" className="btn btn-danger" onClick={() => handleDelete(ev.id)}>
                            Delete
                          </button>
                        </div>
                      </div>
                      {rejectingEventId === `all-${ev.id}` ? (
                        <div className="detail-actions" style={{ borderTop: "1px solid var(--border)", paddingTop: "0.75rem" }}>
                          <label htmlFor={`reject-all-event-${ev.id}`} className="label" style={{ fontSize: "0.8125rem" }}>
                            Comment for organizer (required)
                          </label>
                          <textarea
                            id={`reject-all-event-${ev.id}`}
                            className="input textarea"
                            value={rejectCommentDraft}
                            onChange={(e) => setRejectCommentDraft(e.target.value)}
                            rows={4}
                            placeholder="Briefly explain why this event was disapproved…"
                          />
                          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                            <button
                              type="button"
                              className="btn btn-danger"
                              disabled={rejectSubmitting}
                              onClick={() => submitDisapprovalForEvent(ev.id)}
                            >
                              {rejectSubmitting ? "Submitting…" : "Submit disapproval"}
                            </button>
                            <button
                              type="button"
                              className="btn btn-ghost"
                              disabled={rejectSubmitting}
                              onClick={() => {
                                setRejectingEventId(null);
                                setRejectCommentDraft("");
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : null}
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
    <main className="dash-layout">
      <aside className="dash-sidebar">
        <h3>EventHub</h3>
        <p>Dashboard</p>
        <p>
          <Link to="/events" style={{ color: "inherit" }}>
            Browse current events
          </Link>
        </p>
        <p>Profile</p>
        <p>Settings</p>
      </aside>

      <section className="dash-content">
        <h1 className="page-title" style={{ fontSize: "1.35rem" }}>
          Welcome back, {userName}!
        </h1>
        <p className="page-lede">Browse and RSVP from the public event list.</p>
        <section className="card card-pad">
          <h3 className="page-title" style={{ fontSize: "1.05rem", marginBottom: "0.35rem" }}>
            Explore
          </h3>
          <p className="page-lede" style={{ margin: 0 }}>
            Open <Link to="/events">current events</Link> to get started.
          </p>
        </section>
      </section>
    </main>
  );
}
