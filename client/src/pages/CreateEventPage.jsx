import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createEvent, getEventCategories } from "../services/eventService";
import { normalizeCategoryLabel } from "../utils/categoryLabel";

const OTHER_CATEGORY = "__others__";

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
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [categorySelect, setCategorySelect] = useState("");
  const [otherCategoryText, setOtherCategoryText] = useState("");
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getEventCategories();
        const list = Array.isArray(res?.data) ? res.data : [];
        if (!cancelled) {
          setCategoryOptions(list);
        }
      } catch {
        if (!cancelled) {
          setCategoryOptions([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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

    if (!categorySelect) {
      setError("Please select a category.");
      return;
    }

    if (categorySelect === OTHER_CATEGORY && !otherCategoryText.trim()) {
      setError("Please enter a category for Others.");
      return;
    }

    const categoryForDb =
      categorySelect === OTHER_CATEGORY
        ? normalizeCategoryLabel(otherCategoryText)
        : normalizeCategoryLabel(categorySelect);

    if (!categoryForDb) {
      setError("Category is required.");
      return;
    }

    const endNormalized = normalizeTime(end_time);
    if (!endNormalized) {
      setError("End time is required.");
      return;
    }

    const priceNum = Number(ticket_price);
    const body = {
      title: title.trim(),
      event_description: event_description.trim(),
      category: categoryForDb,
      event_date,
      start_time: normalizeTime(start_time),
      end_time: endNormalized,
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

  return (
    <main className="page page-narrow">
      <Link to="/events" className="back-link">
        ← Back to current events
      </Link>
      <section className="card card-pad-lg">
        <h1 className="page-title" style={{ marginBottom: "0.35rem" }}>
          Create event
        </h1>
        <p className="page-lede" style={{ marginBottom: "1.25rem" }}>
          Submit for admin approval. Required: title, description, category, date, start and end time, and capacity.
        </p>

        <form onSubmit={onSubmit} className="form-stack">
          <label htmlFor="evt-title" className="label">
            Title *
          </label>
          <input
            id="evt-title"
            type="text"
            className="input field-gap"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <label htmlFor="evt-desc" className="label">
            Description *
          </label>
          <textarea
            id="evt-desc"
            className="input textarea field-gap"
            required
            value={event_description}
            onChange={(e) => setEventDescription(e.target.value)}
            rows={5}
          />

          <label htmlFor="evt-cat" className="label">
            Category *
          </label>
          <select
            id="evt-cat"
            className="select field-gap"
            required
            value={categorySelect}
            onChange={(e) => {
              setCategorySelect(e.target.value);
              if (e.target.value !== OTHER_CATEGORY) {
                setOtherCategoryText("");
              }
            }}
          >
            <option value="">Select a category</option>
            {categoryOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            <option value={OTHER_CATEGORY}>Others</option>
          </select>
          {categorySelect === OTHER_CATEGORY ? (
            <input
              type="text"
              className="input field-gap"
              required
              placeholder="Enter your category"
              value={otherCategoryText}
              onChange={(e) => setOtherCategoryText(e.target.value)}
            />
          ) : null}

          <div className="form-grid-2">
            <div>
              <label htmlFor="evt-date" className="label">
                Event date *
              </label>
              <input
                id="evt-date"
                type="date"
                className="input field-gap"
                required
                value={event_date}
                onChange={(e) => setEventDate(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="evt-cap" className="label">
                Capacity *
              </label>
              <input
                id="evt-cap"
                type="number"
                className="input field-gap"
                min={1}
                required
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div>
              <label htmlFor="evt-start" className="label">
                Start time *
              </label>
              <input
                id="evt-start"
                type="time"
                className="input field-gap"
                required
                value={start_time}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="evt-end" className="label">
                End time *
              </label>
              <input
                id="evt-end"
                type="time"
                className="input field-gap"
                required
                value={end_time}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <h3 className="detail-section-title" style={{ marginTop: "0.5rem" }}>
            Location (optional)
          </h3>
          <input
            type="text"
            className="input field-gap"
            placeholder="Venue name"
            value={location_name}
            onChange={(e) => setLocationName(e.target.value)}
          />
          <input
            type="text"
            className="input field-gap"
            placeholder="Street address"
            value={location_address}
            onChange={(e) => setLocationAddress(e.target.value)}
          />
          <div className="form-grid-3">
            <input
              type="text"
              className="input field-gap"
              placeholder="City"
              value={location_city}
              onChange={(e) => setLocationCity(e.target.value)}
            />
            <input
              type="text"
              className="input field-gap"
              placeholder="State"
              value={location_state}
              onChange={(e) => setLocationState(e.target.value)}
            />
            <input
              type="text"
              className="input field-gap"
              placeholder="ZIP"
              value={location_zip_code}
              onChange={(e) => setLocationZip(e.target.value)}
            />
          </div>

          <label className="filter-check field-gap">
            <input type="checkbox" checked={is_free} onChange={(e) => setIsFree(e.target.checked)} />
            Free event
          </label>
          {!is_free ? (
            <div>
              <label htmlFor="evt-price" className="label">
                Ticket price (USD)
              </label>
              <input
                id="evt-price"
                type="number"
                className="input field-gap"
                min={0}
                step="0.01"
                value={ticket_price}
                onChange={(e) => setTicketPrice(e.target.value)}
              />
            </div>
          ) : null}

          <label htmlFor="evt-notes" className="label">
            Schedule notes
          </label>
          <textarea
            id="evt-notes"
            className="input textarea field-gap"
            value={schedule_notes}
            onChange={(e) => setScheduleNotes(e.target.value)}
            rows={3}
          />

          <label htmlFor="evt-cal" className="label">
            Calendar link
          </label>
          <input
            id="evt-cal"
            type="url"
            className="input field-gap"
            placeholder="https://..."
            value={calendar_link}
            onChange={(e) => setCalendarLink(e.target.value)}
          />

          {error ? (
            <p className="text-error" style={{ margin: "0.5rem 0" }}>
              {error}
            </p>
          ) : null}

          <div className="form-actions">
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting ? "Creating…" : "Submit event"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
