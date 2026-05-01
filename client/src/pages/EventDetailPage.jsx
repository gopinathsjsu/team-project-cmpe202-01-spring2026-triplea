import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import RSVPButton from "../components/RSVPButton";
import { getEventById } from "../services/eventService";
import { formatDisplayDate } from "../utils/formatDisplayDate";

export default function EventDetailPage() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
          setError("Event not found.");
          return;
        }
        setEvent(data);
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Something went wrong.");
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
      setError("Invalid event link.");
    }

    return () => {
      cancelled = true;
    };
  }, [id]);

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
            <strong>Capacity:</strong> {event.capacity ?? "—"}
          </p>
          <p style={{ margin: "0 0 4px 0" }}>
            <strong>Pricing:</strong> {formatPrice()}
          </p>
          <p style={{ margin: "0 0 12px 0" }}>
            <strong>Status:</strong> {event.approval_status ?? "—"}
          </p>

          <RSVPButton />
          <button type="button" style={{ marginTop: "8px", width: "100%", padding: "8px" }}>
            Add to Calendar
          </button>
        </aside>
      </div>
    </main>
  );
}
