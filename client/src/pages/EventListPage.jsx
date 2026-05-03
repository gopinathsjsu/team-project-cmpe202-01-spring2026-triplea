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
  const [sortBy, setSortBy] = useState("date_asc");
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
          sortBy,
        });
        setEvents(Array.isArray(response?.data) ? response.data : []);
      } catch (fetchError) {
        setError(fetchError?.message || "Failed to load events");
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, [keyword, category, dateFrom, dateTo, location, sortBy]);

  const clearFilters = () => {
    setKeyword("");
    setCategory("");
    setDateFrom("");
    setDateTo("");
    setLocation("");
  };

  return (
    <main className="page">
      <header className="card card-pad events-toolbar">
        <input
          type="text"
          className="search-input"
          placeholder="Search events, categories, or locations..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          aria-label="Search events"
        />
        {isOrganizer ? (
          <Link to="/create-event" className="btn btn-primary">
            Create event
          </Link>
        ) : null}
      </header>

      <div className="events-layout">
        <aside className="card card-pad filters-panel">
          <h3>Filters</h3>

          <label className="filter-label" htmlFor="filter-category">
            Category
          </label>
          <select
            id="filter-category"
            className="select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All categories</option>
            {categoryOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <p className="filter-label" style={{ marginTop: "0.75rem" }}>
            Date range
          </p>
          <label className="filter-label" htmlFor="filter-from">
            From
          </label>
          <input
            id="filter-from"
            className="input"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <label className="filter-label" htmlFor="filter-to">
            To
          </label>
          <input
            id="filter-to"
            className="input"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
          <p className="filter-hint">
            Both empty: all dates. From only: that day onward. To only: up to that day.
          </p>

          <label className="filter-label" htmlFor="filter-location">
            Location
          </label>
          <input
            id="filter-location"
            className="input"
            type="text"
            placeholder="City, venue, ZIP…"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />

          <p className="filter-label" style={{ marginTop: "0.75rem" }}>
            Price
          </p>
          <label className="filter-check">
            <input type="checkbox" />
            Free
          </label>
          <label className="filter-check">
            <input type="checkbox" />
            All events
          </label>

          <button type="button" className="btn btn-secondary btn-block" style={{ marginTop: "0.75rem" }} onClick={clearFilters}>
            Clear filters
          </button>
        </aside>

        <section className="card card-pad-lg">
          <div className="events-main__head">
            <h2>Events</h2>
            <div className="events-main__sort-wrap">
              <label className="events-main__sort-label" htmlFor="event-sort">
                Sort
              </label>
              <select
                id="event-sort"
                className="select events-main__sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort events"
              >
                <option value="date_asc">Date (earliest first)</option>
                <option value="date_desc">Date (latest first)</option>
                <option value="title_asc">Title A–Z</option>
                <option value="title_desc">Title Z–A</option>
              </select>
            </div>
          </div>
          <p className="page-lede" style={{ marginBottom: "1rem" }}>
            Discover campus and community events from organizers.
          </p>
          {loading ? <p className="text-muted">Loading events…</p> : null}
          {error ? <p className="text-error">{error}</p> : null}
          {!loading && !error && events.length === 0 ? <p className="text-muted">No events match your filters.</p> : null}
          {!loading && !error && events.length > 0 ? (
            <div className="event-grid">
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
