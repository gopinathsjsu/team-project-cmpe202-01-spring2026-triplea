import { useEffect, useState } from "react";
import EventCard from "../components/EventCard";
import { getEvents } from "../services/eventService";

export default function EventListPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await getEvents();
        setEvents(Array.isArray(response?.data) ? response.data : []);
      } catch (fetchError) {
        setError(fetchError?.message || "Failed to load events");
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  return (
    <main style={{ padding: "16px", display: "grid", gap: "12px" }}>
      <header style={{ border: "1px solid #ddd", padding: "10px", display: "flex", gap: "12px", alignItems: "center" }}>
        <input
          type="text"
          placeholder="Search events, categories, or locations..."
          style={{ flex: 1, padding: "8px", border: "1px solid #ccc" }}
        />
        <button type="button">Create Event</button>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: "16px", alignItems: "start" }}>
        <aside style={{ border: "1px solid #ddd", padding: "12px", alignSelf: "start" }}>
          <h3>Filters</h3>
          <p style={{ marginBottom: "6px" }}>Category</p>
          <label style={{ display: "block" }}>
            <input type="checkbox" /> All Categories
          </label>
          <label style={{ display: "block" }}>
            <input type="checkbox" /> Music
          </label>
          <label style={{ display: "block" }}>
            <input type="checkbox" /> Tech
          </label>
          <p style={{ marginTop: "10px", marginBottom: "6px" }}>Date</p>
          <input type="text" placeholder="From" style={{ width: "100%", marginBottom: "6px" }} />
          <input type="text" placeholder="To" style={{ width: "100%", marginBottom: "6px" }} />
          <p style={{ marginTop: "10px", marginBottom: "6px" }}>Location</p>
          <input type="text" placeholder="Enter location..." style={{ width: "100%", marginBottom: "6px" }} />
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
