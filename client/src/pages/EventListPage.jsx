import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import EventCard from "../components/EventCard";
import { decodeJwtPayload } from "../utils/decodeJwtPayload";
import { getEvents, getEventCategories } from "../services/eventService";

export default function EventListPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [location, setLocation] = useState("");
  const [categoryOptions, setCategoryOptions] = useState([]);
  const isOrganizer = decodeJwtPayload(localStorage.getItem("token"))?.role === "organizer";

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

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await getEvents({
          keyword,
          category,
          dateFrom,
          dateTo,
          location,
        });
        setEvents(Array.isArray(response?.data) ? response.data : []);
      } catch (fetchError) {
        setError(fetchError?.message || "Failed to load events");
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [keyword, category, dateFrom, dateTo, location]);

  return (
    <main style={{ padding: "16px", display: "grid", gap: "12px" }}>
      <header style={{ border: "1px solid #ddd", padding: "10px", display: "flex", gap: "12px", alignItems: "center" }}>
        <input
          type="text"
          placeholder="Search events, categories, or locations..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          style={{ flex: 1, padding: "8px", border: "1px solid #ccc" }}
        />
        {isOrganizer ? (
          <Link to="/create-event" style={{ padding: "8px 14px", border: "1px solid #bbb", textDecoration: "none", color: "inherit", fontSize: "14px" }}>
            Create Event
          </Link>
        ) : null}
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: "16px", alignItems: "start" }}>
        <aside style={{ border: "1px solid #ddd", padding: "12px", alignSelf: "start" }}>
          <h3>Filters</h3>
          <p style={{ marginBottom: "6px" }}>Category</p>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ width: "100%", marginBottom: "6px", padding: "6px" }}
          >
            <option value="">All Categories</option>
            {categoryOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <p style={{ marginTop: "10px", marginBottom: "6px" }}>Date range</p>
          <label style={{ display: "block", fontSize: "13px", marginBottom: "4px" }}>From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            style={{ width: "100%", marginBottom: "8px" }}
          />
          <label style={{ display: "block", fontSize: "13px", marginBottom: "4px" }}>To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            style={{ width: "100%", marginBottom: "6px" }}
          />
          <p style={{ fontSize: "12px", color: "#555", margin: "4px 0 0" }}>
            Both empty: all event dates. From only: that day and later. To only: that day and earlier.
          </p>
          <p style={{ marginTop: "10px", marginBottom: "6px" }}>Location</p>
          <input
            type="text"
            placeholder="Enter location..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            style={{ width: "100%", marginBottom: "6px" }}
          />
          <p style={{ marginTop: "10px", marginBottom: "6px" }}>Price</p>
          <label style={{ display: "block" }}>
            <input type="checkbox" /> Free
          </label>
          <label style={{ display: "block" }}>
            <input type="checkbox" /> All Events
          </label>
        </aside>

        <section style={{ border: "1px solid #ddd", padding: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <h2 style={{ margin: 0 }}>Popular Events</h2>
            <small>Sort by: Latest</small>
          </div>
          <p style={{ marginTop: 0 }}>Browse upcoming events from organizers.</p>
          {loading ? <p>Loading events...</p> : null}
          {error ? <p style={{ color: "#b00020" }}>{error}</p> : null}
          {!loading && !error && events.length === 0 ? <p>No events found.</p> : null}
          {!loading && !error && events.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "12px" }}>
              {events.map((event) => (
                <EventCard
                  key={event.id}
                  id={event.id}
                  title={event.title}
                  category={event.category}
                  event_date={event.event_date}
                  start_time={event.start_time}
                  location_name={event.location_name}
                  capacity={event.capacity}
                />
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
