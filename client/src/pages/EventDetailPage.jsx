import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import RSVPButton from "../components/RSVPButton";
import EventMap from "../components/EventMap";
import {
  approveEventById,
  deleteEventById,
  getEventAttendees,
  getEventById,
  rejectEventById,
  removeEventAttendee,
} from "../services/eventService";
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
  const [removingAttendeeId, setRemovingAttendeeId] = useState(null);
  const [removeAttendeeReason, setRemoveAttendeeReason] = useState("");
  const [removeAttendeeLoading, setRemoveAttendeeLoading] = useState(false);

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
  const isAttendee = decoded?.role === "attendee";
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
    setRejectFormOpen(false);
    setRejectDraft("");
    setRemovingAttendeeId(null);
    setRemoveAttendeeReason("");
  }, [event?.id]);

  useEffect(() => {
    if (event?.approval_status === "rejected") {
      setRejectFormOpen(false);
      setRejectDraft("");
    }
  }, [event?.approval_status]);

  if (loading) {
    return (
      <main className="page">
        <p className="text-muted loading-shimmer" role="status" aria-live="polite">Loading event…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="page">
        <p className="text-error" role="alert">{error}</p>
        <p>
          <Link to="/events">← Back to current events</Link>
        </p>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="page">
        <p role="status">No event data available.</p>
        <p>
          <Link to="/events">← Back to current events</Link>
        </p>
      </main>
    );
  }

  const adminCanDisapprove =
    isAdmin && (event.approval_status === "pending" || event.approval_status === "approved");

  const formatPrice = () => "Free";

  const locationLines = [
    event.location_name,
    event.location_address,
    [event.location_city, event.location_state, event.location_zip_code].filter(Boolean).join(", ") || null,
  ].filter(Boolean);

  const openCalendarLink = () => {
  if (!event?.google_calendar_link) {
    window.alert("Calendar link is not available for this event.");
    return;
  }

  window.open(event.google_calendar_link, "_blank", "noopener,noreferrer");
};

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

  const submitRemoveAttendee = async (attendeeId) => {
    const token = localStorage.getItem("token");
    if (!token || !event?.id || attendeeId == null) {
      return;
    }
    const trimmed = removeAttendeeReason.trim();
    if (!trimmed) {
      window.alert("Removal reason is required.");
      return;
    }
    setRemoveAttendeeLoading(true);
    try {
      await removeEventAttendee(event.id, attendeeId, token, { removal_reason: trimmed });
      window.alert("Attendee removed from this event.");
      setAttendees((prev) => prev.filter((attendee) => Number(attendee.id) !== Number(attendeeId)));
      setRemovingAttendeeId(null);
      setRemoveAttendeeReason("");
      await reloadEvent();
    } catch (err) {
      window.alert(err?.message || "Failed to remove attendee");
    } finally {
      setRemoveAttendeeLoading(false);
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
    <main className="page">
      <Link to="/events" className="back-link">
        ← Back to current events
      </Link>

      <div className="detail-layout">
        <section className="card card-pad-lg detail-main">
          <h1>{event.title || "Untitled event"}</h1>
          {event.category ? (
            <p className="page-lede" style={{ marginBottom: "1rem" }}>
              {event.category}
            </p>
          ) : null}

          <div className="detail-section-title">About</div>
          <p style={{ whiteSpace: "pre-wrap" }}>{event.event_description || "—"}</p>

          <div className="detail-section-title">When</div>
          <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
            <li>Date: {formatDisplayDate(event.event_date)}</li>
            <li>Starts: {event.start_time ?? "—"}</li>
            <li>Ends: {event.end_time != null ? event.end_time : "—"}</li>
          </ul>

          {event.schedule_notes ? (
            <>
              <div className="detail-section-title">Schedule notes</div>
              <p style={{ whiteSpace: "pre-wrap" }}>{event.schedule_notes}</p>
            </>
          ) : null}

          <div className="detail-section-title">Organizer</div>
          <p style={{ marginBottom: 0 }}>{event.organizer_full_name?.trim() ? event.organizer_full_name : "—"}</p>

          {canSeeAttendees ? (
            <section style={{ marginTop: "1.25rem", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
              <div className="detail-section-title">RSVP attendees</div>
              {attendeesLoading ? <p className="text-muted" role="status" aria-live="polite">Loading attendee list…</p> : null}
              {attendeesError ? <p className="text-error" role="alert">{attendeesError}</p> : null}
              {!attendeesLoading && !attendeesError ? (
                attendees.length === 0 ? (
                  <p className="text-muted" role="status">No attendees yet.</p>
                ) : (
                  <ul style={{ margin: 0, paddingLeft: "1.25rem", display: "grid", gap: "0.75rem" }}>
                    {attendees.map((user) => (
                      <li key={user.id}>
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
                          <div>
                            <span>{user.full_name || "Unknown attendee"}</span>
                            <span className="text-muted"> ({user.email || "no email"})</span>
                          </div>
                          <button
                            type="button"
                            className="btn btn-danger"
                            style={{ padding: "0.35rem 0.65rem", fontSize: "0.8125rem" }}
                            disabled={removeAttendeeLoading}
                            onClick={() => {
                              setRemovingAttendeeId(user.id);
                              setRemoveAttendeeReason("");
                            }}
                          >
                            Remove attendee
                          </button>
                        </div>
                        {Number(removingAttendeeId) === Number(user.id) ? (
                          <div className="detail-actions" style={{ marginTop: "0.5rem" }}>
                            <label htmlFor={`remove-attendee-reason-${user.id}`} className="label" style={{ fontSize: "0.8125rem" }}>
                              Reason for removal (required)
                            </label>
                            <textarea
                              id={`remove-attendee-reason-${user.id}`}
                              className="input textarea"
                              value={removeAttendeeReason}
                              onChange={(e) => setRemoveAttendeeReason(e.target.value)}
                              rows={3}
                              placeholder="Explain why this attendee is being removed…"
                              disabled={removeAttendeeLoading}
                            />
                            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                              <button
                                type="button"
                                className="btn btn-danger"
                                disabled={removeAttendeeLoading}
                                onClick={() => submitRemoveAttendee(user.id)}
                              >
                                {removeAttendeeLoading ? "Removing…" : "Confirm remove"}
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost"
                                disabled={removeAttendeeLoading}
                                onClick={() => {
                                  setRemovingAttendeeId(null);
                                  setRemoveAttendeeReason("");
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )
              ) : null}
            </section>
          ) : null}
        </section>

        <aside className="card card-pad detail-aside">
          <h2>Location</h2>
          {locationLines.length > 0 ? (
            locationLines.map((line, index) => (
              <p key={`${index}-${line}`} style={{ margin: "0 0 0.25rem" }}>
                {line}
              </p>
            ))
          ) : (
            <p className="text-muted" style={{ marginTop: 0 }}>
              Location TBD
            </p>
          )}

          <EventMap event={event} />

          <hr className="divider" />

          <p style={{ margin: "0 0 0.35rem" }}>
            <strong>Capacity</strong> {event.capacity ?? "—"}
          </p>
          <p style={{ margin: "0 0 0.35rem" }}>
            <strong>Registered</strong> {event.registered_count != null ? String(event.registered_count) : "—"}
          </p>
          <p style={{ margin: "0 0 0.35rem" }}>
            <strong>Price</strong> {formatPrice()}
          </p>
          {!isAttendee && (isAdmin || !isOrganizerOwner) ? (
            <p style={{ margin: "0 0 0.75rem" }}>
              <strong>Status</strong> {event.approval_status ?? "—"}
            </p>
          ) : null}
          {isAdmin && event.approval_status === "rejected" && event.rejection_reason?.trim() ? (
            <p className="callout callout--warn" style={{ margin: "0 0 0.75rem", whiteSpace: "pre-wrap", fontSize: "0.8125rem" }}>
              <strong>Rejection reason:</strong> {event.rejection_reason.trim()}
            </p>
          ) : null}

          {isAdmin ? (
            <div className="detail-actions">
              <button
                type="button"
                className="btn btn-primary btn-block"
                onClick={handleApproveEvent}
                disabled={deleteLoading || event.approval_status === "approved" || event.approval_status === "rejected"}
              >
                {event.approval_status === "approved"
                  ? "Approved"
                  : deleteLoading
                    ? "Working…"
                    : "Approve"}
              </button>
              {adminCanDisapprove && !rejectFormOpen ? (
                <button
                  type="button"
                  className="btn btn-secondary btn-block"
                  onClick={() => {
                    setRejectFormOpen(true);
                    setRejectDraft("");
                  }}
                  disabled={deleteLoading}
                >
                  Disapprove
                </button>
              ) : null}
              {adminCanDisapprove && rejectFormOpen ? (
                <div className="detail-actions">
                  <label htmlFor="event-rejection-comment" className="label" style={{ fontSize: "0.8125rem" }}>
                    Comment for organizer (required)
                  </label>
                  <textarea
                    id="event-rejection-comment"
                    className="input textarea"
                    value={rejectDraft}
                    onChange={(e) => setRejectDraft(e.target.value)}
                    rows={4}
                    placeholder="Briefly explain why this event was disapproved…"
                    disabled={deleteLoading}
                  />
                  <button
                    type="button"
                    className="btn btn-danger btn-block"
                    onClick={submitDisapproval}
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? "Submitting…" : "Submit disapproval"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-block"
                    disabled={deleteLoading}
                    onClick={() => {
                      setRejectFormOpen(false);
                      setRejectDraft("");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : null}
            </div>
          ) : isOrganizerOwner ? (
            <div className="detail-actions" style={{ marginBottom: "0.75rem" }}>
              <p className="callout callout--neutral" style={{ margin: 0, fontSize: "0.9375rem" }}>
                <strong>Status</strong> {formatApprovalStatusLabel(event.approval_status)}
              </p>
              {event.pending_update_request_id ? (
                <p className="callout callout--neutral" style={{ margin: 0, fontSize: "0.875rem" }}>
                  An edited version is waiting for admin approval. The live event still shows the approved details.
                </p>
              ) : null}
              {event.latest_update_rejection_reason?.trim() ? (
                <p className="callout callout--warn" style={{ margin: 0, fontSize: "0.875rem", whiteSpace: "pre-wrap" }}>
                  <strong>Latest update disapproval note:</strong> {event.latest_update_rejection_reason.trim()}
                </p>
              ) : null}
              {event.approval_status === "rejected" && event.rejection_reason?.trim() ? (
                <p className="callout callout--warn" style={{ margin: 0, fontSize: "0.875rem", whiteSpace: "pre-wrap" }}>
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
          {isAttendee && event.attendee_removal_reason?.trim() ? (
            <p className="callout callout--warn" style={{ margin: "0.75rem 0 0", fontSize: "0.875rem", whiteSpace: "pre-wrap" }}>
              <strong>You were removed from this event:</strong> {event.attendee_removal_reason.trim()}
            </p>
          ) : null}
          {isOrganizerOwner ? (
            <Link to={`/events/${event.id}/edit`} className="btn btn-secondary btn-block" style={{ marginTop: "0.5rem" }}>
              Edit event
            </Link>
          ) : null}
          {isOrganizerOwner || isAdmin ? (
            <button
              type="button"
              className="btn btn-danger btn-block"
              onClick={handleDeleteEvent}
              disabled={deleteLoading}
              style={{ marginTop: "0.5rem" }}
            >
              {deleteLoading ? "Deleting…" : "Delete event"}
            </button>
          ) : null}
          <button
            type="button"
            className="btn btn-secondary btn-block"
            style={{ marginTop: "0.5rem" }}
            onClick={openCalendarLink}
            disabled={!event.google_calendar_link}
          >
            Add to Google Calendar
          </button>
        </aside>
      </div>
    </main>
  );
}
