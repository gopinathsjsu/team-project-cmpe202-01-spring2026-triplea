import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import RSVPButton from "../components/RSVPButton";
import { approveEventById, deleteEventById, getEventAttendees, getEventById, rejectEventById } from "../services/eventService";
import { decodeJwtPayload } from "../utils/decodeJwtPayload";
import { formatDisplayDate } from "../utils/formatDisplayDate";

function isEventNotFoundMessage(message) {
  if (message == null || typeof message !== "string") {
    return false;
  }
  return message.trim().replace(/\.$/, "").toLowerCase() === "event not found";
}

function formatApprovalStatusLabel(status) {
  if (status == null || typeof status !== "string" || !status.trim()) {
    return "—";
  }
  const s = status.trim();
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [attendeesLoading, setAttendeesLoading] = useState(false);
  const [attendeesError, setAttendeesError] = useState("");
  const [rejectFormOpen, setRejectFormOpen] = useState(false);
  const [rejectDraft, setRejectDraft] = useState("");

  const goToEventsWithNotFoundNotice = useCallback(() => {
    window.alert("Event not found");
    navigate("/events", { replace: true });
  }, [navigate]);

  const reloadEvent = useCallback(async () => {
    if (!id) {
      return;
    }
    try {
      const response = await getEventById(id);
      const data = response?.data;
      if (response?.success && data != null) {
        setEvent(data);
      }
    } catch (err) {
      if (isEventNotFoundMessage(err?.message)) {
        goToEventsWithNotFoundNotice();
      }
    }
  }, [id, goToEventsWithNotFoundNotice]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setEvent(null);

      try {
        const response = await getEventById(id);
        if (cancelled) {
          return;
        }

        const data = response?.data;
        if (!response?.success || data == null) {
          if (!cancelled) {
            if (isEventNotFoundMessage(response?.message)) {
              goToEventsWithNotFoundNotice();
            } else {
              setError(response?.message || "Something went wrong.");
            }
          }
          return;
        }
        setEvent(data);
      } catch (err) {
        if (!cancelled) {
          if (isEventNotFoundMessage(err?.message)) {
            goToEventsWithNotFoundNotice();
          } else {
            setError(err?.message || "Something went wrong.");
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (id) {
      load();
    } else {
      setLoading(false);
      goToEventsWithNotFoundNotice();
    }

    return () => {
      cancelled = true;
    };
  }, [id, goToEventsWithNotFoundNotice]);

  const decoded = decodeJwtPayload(localStorage.getItem("token"));
  const isAdmin = decoded?.role === "admin";
  const isOrganizerOwner =
    decoded?.role === "organizer" &&
    Number(decoded?.userId) === Number(event?.organizer_id);
  const canSeeAttendees = isAdmin || isOrganizerOwner;

  useEffect(() => {
    if (!event?.id || !canSeeAttendees) {
      setAttendees([]);
      setAttendeesLoading(false);
      setAttendeesError("");
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      setAttendees([]);
      setAttendeesLoading(false);
      setAttendeesError("");
      return;
    }
    let cancelled = false;
    (async () => {
      setAttendeesLoading(true);
      setAttendeesError("");
      try {
        const res = await getEventAttendees(event.id, token);
        if (!cancelled) {
          setAttendees(Array.isArray(res?.data) ? res.data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setAttendees([]);
          setAttendeesError(err?.message || "Failed to load attendee list");
        }
      } finally {
        if (!cancelled) {
          setAttendeesLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [event?.id, canSeeAttendees]);

  useEffect(() => {
    if (event?.approval_status !== "pending") {
      setRejectFormOpen(false);
      setRejectDraft("");
    }
  }, [event?.approval_status]);

  if (loading) {
    return (
      <main style={{ padding: "16px" }}>
        <p>Loading event…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main style={{ padding: "16px" }}>
        <p style={{ color: "#b00020" }}>{error}</p>
        <p>
          <Link to="/events">← Back to events</Link>
        </p>
      </main>
    );
  }

  if (!event) {
    return (
      <main style={{ padding: "16px" }}>
        <p>No event data available.</p>
        <p>
          <Link to="/events">← Back to events</Link>
        </p>
      </main>
    );
  }

  const formatPrice = () => {
    if (event.is_free) {
      return "Free";
    }
    const price = event.ticket_price != null ? String(event.ticket_price) : "—";
    return `$${price}`;
  };

  const locationLines = [
    event.location_name,
    event.location_address,
    [event.location_city, event.location_state, event.location_zip_code].filter(Boolean).join(", ") || null,
  ].filter(Boolean);

  const handleApproveEvent = async () => {
    const token = localStorage.getItem("token");
    if (!token || !event?.id) {
      return;
    }
    setDeleteLoading(true);
    try {
      await approveEventById(event.id, token);
      window.alert("Event approved successfully");
      await reloadEvent();
    } catch (err) {
      window.alert(err?.message || "Failed to approve event");
    } finally {
      setDeleteLoading(false);
    }
  };

  const submitDisapproval = async () => {
    const token = localStorage.getItem("token");
    if (!token || !event?.id) {
      return;
    }
    const trimmed = rejectDraft.trim();
    if (!trimmed) {
      window.alert("Rejection comment is required.");
      return;
    }
    setDeleteLoading(true);
    try {
      await rejectEventById(event.id, token, { rejection_reason: trimmed });
      window.alert("Event disapproved (rejected).");
      setRejectFormOpen(false);
      setRejectDraft("");
      await reloadEvent();
    } catch (err) {
      window.alert(err?.message || "Failed to disapprove event");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    const token = localStorage.getItem("token");
    if (!token || !event?.id) {
      return;
    }
    const ok = window.confirm("Delete this event?");
    if (!ok) {
      return;
    }
    setDeleteLoading(true);
    try {
      await deleteEventById(event.id, token);
      window.alert("Event deleted successfully");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      window.alert(err?.message || "Failed to delete event");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <main style={{ padding: "16px" }}>
      <p style={{ marginBottom: "12px" }}>
        <Link to="/events">← Back to events</Link>
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "16px", alignItems: "start" }}>
        <section style={{ border: "1px solid #ddd", padding: "12px" }}>
          <h1 style={{ marginTop: 0, marginBottom: "8px" }}>{event.title || "Untitled event"}</h1>
          {event.category ? (
            <p style={{ marginTop: 0, color: "#555", fontSize: "14px" }}>Category: {event.category}</p>
          ) : null}

          <h2 style={{ fontSize: "16px", marginBottom: "6px" }}>About</h2>
          <p style={{ marginTop: 0, whiteSpace: "pre-wrap" }}>{event.event_description || "—"}</p>

          <h2 style={{ fontSize: "16px", marginBottom: "6px" }}>When</h2>
          <ul style={{ margin: 0, paddingLeft: "20px" }}>
            <li>Date: {formatDisplayDate(event.event_date)}</li>
            <li>Starts: {event.start_time ?? "—"}</li>
            <li>Ends: {event.end_time != null ? event.end_time : "—"}</li>
          </ul>

          {event.schedule_notes ? (
            <>
              <h2 style={{ fontSize: "16px", marginBottom: "6px" }}>Schedule notes</h2>
              <p style={{ marginTop: 0, whiteSpace: "pre-wrap" }}>{event.schedule_notes}</p>
            </>
          ) : null}

          <h2 style={{ fontSize: "16px", marginBottom: "6px" }}>Organizer</h2>
          <p style={{ marginTop: 0 }}>
            {event.organizer_full_name?.trim() ? event.organizer_full_name : "—"}
          </p>

          {canSeeAttendees ? (
            <section style={{ marginTop: "14px", borderTop: "1px solid #eee", paddingTop: "10px" }}>
              <h2 style={{ fontSize: "16px", marginBottom: "6px" }}>RSVP attendees</h2>
              {attendeesLoading ? <p style={{ marginTop: 0 }}>Loading attendee list…</p> : null}
              {attendeesError ? <p style={{ marginTop: 0, color: "#b00020" }}>{attendeesError}</p> : null}
              {!attendeesLoading && !attendeesError ? (
                attendees.length === 0 ? (
                  <p style={{ marginTop: 0, color: "#666" }}>No attendees yet.</p>
                ) : (
                  <ul style={{ margin: 0, paddingLeft: "18px", display: "grid", gap: "6px" }}>
                    {attendees.map((user) => (
                      <li key={user.id}>
                        <span>{user.full_name || "Unknown attendee"}</span>
                        <span style={{ color: "#555" }}> ({user.email || "no email"})</span>
                      </li>
                    ))}
                  </ul>
                )
              ) : null}
            </section>
          ) : null}
        </section>

        <aside style={{ border: "1px solid #ddd", padding: "12px", background: "#fcfcfc" }}>
          <h2 style={{ fontSize: "16px", marginTop: 0 }}>Location</h2>
          {locationLines.length > 0 ? (
            locationLines.map((line, index) => (
              <p key={`${index}-${line}`} style={{ margin: "0 0 4px 0" }}>
                {line}
              </p>
            ))
          ) : (
            <p style={{ marginTop: 0 }}>Location TBD</p>
          )}

          <hr style={{ margin: "12px 0" }} />

          <p style={{ margin: "0 0 4px 0" }}>
            <strong>Capacity limit:</strong> {event.capacity ?? "—"}
          </p>
          <p style={{ margin: "0 0 4px 0" }}>
            <strong>Registered Count:</strong>{" "}
            {event.registered_count != null ? String(event.registered_count) : "—"}
          </p>
          <p style={{ margin: "0 0 4px 0" }}>
            <strong>Pricing:</strong> {formatPrice()}
          </p>
          {(isAdmin || !isOrganizerOwner) ? (
            <p style={{ margin: "0 0 12px 0" }}>
              <strong>Status:</strong> {event.approval_status ?? "—"}
            </p>
          ) : null}
          {isAdmin && event.approval_status === "rejected" && event.rejection_reason?.trim() ? (
            <p
              style={{
                margin: "0 0 12px 0",
                padding: "8px 10px",
                background: "#fff8f8",
                border: "1px solid #f0c4c4",
                fontSize: "13px",
                whiteSpace: "pre-wrap",
              }}
            >
              <strong>Rejection reason:</strong> {event.rejection_reason.trim()}
            </p>
          ) : null}

          {isAdmin ? (
            <div style={{ display: "grid", gap: "8px" }}>
              <button
                type="button"
                onClick={handleApproveEvent}
                disabled={deleteLoading || event.approval_status === "approved" || event.approval_status === "rejected"}
                style={{ width: "100%", padding: "8px" }}
              >
                {event.approval_status === "approved"
                  ? "Approved"
                  : deleteLoading
                    ? "Working…"
                    : "Approve"}
              </button>
              {event.approval_status === "pending" && !rejectFormOpen ? (
                <button
                  type="button"
                  onClick={() => {
                    setRejectFormOpen(true);
                    setRejectDraft("");
                  }}
                  disabled={deleteLoading}
                  style={{ width: "100%", padding: "8px" }}
                >
                  Disapprove
                </button>
              ) : null}
              {event.approval_status === "pending" && rejectFormOpen ? (
                <div style={{ display: "grid", gap: "8px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 600 }}>Comment for organizer (required)</label>
                  <textarea
                    value={rejectDraft}
                    onChange={(e) => setRejectDraft(e.target.value)}
                    rows={4}
                    placeholder="Briefly explain why this event was disapproved…"
                    disabled={deleteLoading}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "8px",
                      fontSize: "14px",
                      fontFamily: "inherit",
                      resize: "vertical",
                    }}
                  />
                  <button
                    type="button"
                    onClick={submitDisapproval}
                    disabled={deleteLoading}
                    style={{ width: "100%", padding: "8px", fontWeight: 600 }}
                  >
                    {deleteLoading ? "Submitting…" : "Submit Disapproval"}
                  </button>
                  <button
                    type="button"
                    disabled={deleteLoading}
                    onClick={() => {
                      setRejectFormOpen(false);
                      setRejectDraft("");
                    }}
                    style={{ width: "100%", padding: "8px" }}
                  >
                    Cancel
                  </button>
                </div>
              ) : null}
            </div>
          ) : isOrganizerOwner ? (
            <div style={{ margin: "0 0 12px 0", display: "grid", gap: "8px" }}>
              <p
                style={{
                  margin: 0,
                  padding: "10px 12px",
                  background: "#f5f5f5",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  fontSize: "15px",
                }}
              >
                <strong>Status:</strong> {formatApprovalStatusLabel(event.approval_status)}
              </p>
              {event.approval_status === "rejected" && event.rejection_reason?.trim() ? (
                <p
                  style={{
                    margin: 0,
                    padding: "10px 12px",
                    background: "#fff8f8",
                    border: "1px solid #f0c4c4",
                    borderRadius: "4px",
                    fontSize: "14px",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  <strong>Why it was disapproved:</strong> {event.rejection_reason.trim()}
                </p>
              ) : null}
            </div>
          ) : (
            <RSVPButton
              eventId={event.id}
              capacityLimit={event.capacity}
              registeredCount={event.registered_count}
              onSuccess={reloadEvent}
            />
          )}
          {isOrganizerOwner || isAdmin ? (
            <button
              type="button"
              onClick={handleDeleteEvent}
              disabled={deleteLoading}
              style={{ marginTop: "8px", width: "100%", padding: "8px" }}
            >
              {deleteLoading ? "Deleting..." : "Delete Event"}
            </button>
          ) : null}
          <button type="button" style={{ marginTop: "8px", width: "100%", padding: "8px" }}>
            Add to Calendar
          </button>
        </aside>
      </div>
    </main>
  );
}
