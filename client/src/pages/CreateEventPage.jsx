import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createEvent } from "../services/eventService";

function normalizeTime(value) {
  if (value == null || typeof value !== "string") {
    return "";
  }
  return value.length >= 5 ? value.slice(0, 5) : value.trim();
}

export default function CreateEventPage() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [event_description, setEventDescription] = useState("");
  const [category, setCategory] = useState("");
  const [event_date, setEventDate] = useState("");
  const [start_time, setStartTime] = useState("");
  const [end_time, setEndTime] = useState("");
  const [capacity, setCapacity] = useState("");
  const [location_name, setLocationName] = useState("");
  const [location_address, setLocationAddress] = useState("");
  const [location_city, setLocationCity] = useState("");
  const [location_state, setLocationState] = useState("");
  const [location_zip_code, setLocationZip] = useState("");
  const [is_free, setIsFree] = useState(true);
  const [ticket_price, setTicketPrice] = useState("0");
  const [schedule_notes, setScheduleNotes] = useState("");
  const [calendar_link, setCalendarLink] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const token = localStorage.getItem("token");
    if (!token) {
      setError("You must be logged in.");
      return;
    }

    const cap = Number(capacity);
    if (!Number.isFinite(cap) || cap <= 0) {
      setError("Capacity must be a positive number.");
      return;
    }

    const priceNum = Number(ticket_price);
    const body = {
      title: title.trim(),
      event_description: event_description.trim(),
      category: category.trim() || null,
      event_date,
      start_time: normalizeTime(start_time),
      end_time: end_time ? normalizeTime(end_time) : null,
      location_name: location_name.trim() || null,
      location_address: location_address.trim() || null,
      location_city: location_city.trim() || null,
      location_state: location_state.trim() || null,
      location_zip_code: location_zip_code.trim() || null,
      capacity: cap,
      is_free: Boolean(is_free),
      ticket_price: is_free ? 0 : priceNum,
      schedule_notes: schedule_notes.trim() || null,
      calendar_link: calendar_link.trim() || null,
    };

    setSubmitting(true);
    try {
      const res = await createEvent(body, token);
      const created = res?.data;
      if (created?.id != null) {
        navigate(`/events/${created.id}`, { replace: true });
        return;
      }
      navigate("/events", { replace: true });
    } catch (err) {
      setError(err?.message || "Could not create event.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = { width: "100%", padding: "8px", marginBottom: "10px", boxSizing: "border-box" };

  return (
    <main style={{ padding: "16px", maxWidth: "720px" }}>
      <p style={{ marginBottom: "12px" }}>
        <Link to="/events">← Back to events</Link>
      </p>
      <section style={{ border: "1px solid #ddd", padding: "16px" }}>
        <h2 style={{ marginTop: 0 }}>Create Event</h2>
        <p style={{ marginTop: 0, color: "#555", fontSize: "14px" }}>
          Submit for admin approval. Required: title, description, date, start time, and capacity.
        </p>

        <form onSubmit={onSubmit}>
          <label htmlFor="evt-title" style={{ display: "block", fontSize: "14px", marginBottom: "4px" }}>
            Title *
          </label>
          <input
            id="evt-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={inputStyle}
          />

          <label htmlFor="evt-desc" style={{ display: "block", fontSize: "14px", marginBottom: "4px" }}>
            Description *
          </label>
          <textarea
            id="evt-desc"
            required
            value={event_description}
            onChange={(e) => setEventDescription(e.target.value)}
            rows={5}
            style={{ ...inputStyle, resize: "vertical" }}
          />

          <label htmlFor="evt-cat" style={{ display: "block", fontSize: "14px", marginBottom: "4px" }}>
            Category
          </label>
          <input
            id="evt-cat"
            type="text"
            placeholder="e.g. Music, Tech"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={inputStyle}
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label htmlFor="evt-date" style={{ display: "block", fontSize: "14px", marginBottom: "4px" }}>
                Event date *
              </label>
              <input id="evt-date" type="date" required value={event_date} onChange={(e) => setEventDate(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label htmlFor="evt-cap" style={{ display: "block", fontSize: "14px", marginBottom: "4px" }}>
                Capacity *
              </label>
              <input
                id="evt-cap"
                type="number"
                min={1}
                required
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div>
              <label htmlFor="evt-start" style={{ display: "block", fontSize: "14px", marginBottom: "4px" }}>
                Start time *
              </label>
              <input id="evt-start" type="time" required value={start_time} onChange={(e) => setStartTime(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label htmlFor="evt-end" style={{ display: "block", fontSize: "14px", marginBottom: "4px" }}>
                End time
              </label>
              <input id="evt-end" type="time" value={end_time} onChange={(e) => setEndTime(e.target.value)} style={inputStyle} />
            </div>
          </div>

          <h3 style={{ fontSize: "16px", margin: "16px 0 8px" }}>Location (optional)</h3>
          <input type="text" placeholder="Venue name" value={location_name} onChange={(e) => setLocationName(e.target.value)} style={inputStyle} />
          <input type="text" placeholder="Address" value={location_address} onChange={(e) => setLocationAddress(e.target.value)} style={inputStyle} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
            <input type="text" placeholder="City" value={location_city} onChange={(e) => setLocationCity(e.target.value)} style={inputStyle} />
            <input type="text" placeholder="State" value={location_state} onChange={(e) => setLocationState(e.target.value)} style={inputStyle} />
            <input type="text" placeholder="ZIP" value={location_zip_code} onChange={(e) => setLocationZip(e.target.value)} style={inputStyle} />
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", fontSize: "14px" }}>
            <input type="checkbox" checked={is_free} onChange={(e) => setIsFree(e.target.checked)} />
            Free event
          </label>
          {!is_free ? (
            <div>
              <label htmlFor="evt-price" style={{ display: "block", fontSize: "14px", marginBottom: "4px" }}>
                Ticket price (USD)
              </label>
              <input
                id="evt-price"
                type="number"
                min={0}
                step="0.01"
                value={ticket_price}
                onChange={(e) => setTicketPrice(e.target.value)}
                style={inputStyle}
              />
            </div>
          ) : null}

          <label htmlFor="evt-notes" style={{ display: "block", fontSize: "14px", marginBottom: "4px" }}>
            Schedule notes
          </label>
          <textarea
            id="evt-notes"
            value={schedule_notes}
            onChange={(e) => setScheduleNotes(e.target.value)}
            rows={3}
            style={{ ...inputStyle, resize: "vertical" }}
          />

          <label htmlFor="evt-cal" style={{ display: "block", fontSize: "14px", marginBottom: "4px" }}>
            Calendar link
          </label>
          <input
            id="evt-cal"
            type="url"
            placeholder="https://..."
            value={calendar_link}
            onChange={(e) => setCalendarLink(e.target.value)}
            style={inputStyle}
          />

          {error ? (
            <p style={{ color: "#b00020", fontSize: "14px", margin: "8px 0" }}>{error}</p>
          ) : null}

          <button type="submit" disabled={submitting} style={{ padding: "10px 18px", marginTop: "8px", cursor: submitting ? "wait" : "pointer" }}>
            {submitting ? "Creating…" : "Submit event"}
          </button>
        </form>
      </section>
    </main>
  );
}
