import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import EventCard from "../components/EventCard";
import { getEventCategories, getPastEventsForAdmin } from "../services/eventService";

export default function AdminPastEventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [location, setLocation] = useState("");
  const [sortBy, setSortBy] = useState("date_desc");
  const [categoryOptions, setCategoryOptions] = useState([]);

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
        const response = await getPastEventsForAdmin({
          keyword,
          category,
          dateFrom,
          dateTo,
          location,
          sortBy,
        });
        setEvents(Array.isArray(response?.data) ? response.data : []);
      } catch (fetchError) {
        setError(fetchError?.message || "Failed to load past events");
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
          aria-label="Search past events"
        />
        <Link to="/events" className="btn btn-secondary">
          Current events
        </Link>
      </header>

      <div className="events-layout">
        <aside className="card card-pad filters-panel">
          <h3>Filters</h3>
          <p className="text-muted" style={{ fontSize: "0.8125rem", marginTop: "-0.25rem", marginBottom: "0.75rem" }}>
            Listing shows dates before today only.
          </p>

          <label className="filter-label" htmlFor="past-filter-category">
            Category
          </label>
          <select
            id="past-filter-category"
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
          <label className="filter-label" htmlFor="past-filter-from">
            From
          </label>
          <input
            id="past-filter-from"
            className="input"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <label className="filter-label" htmlFor="past-filter-to">
            To
          </label>
          <input
            id="past-filter-to"
            className="input"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
          <p className="filter-hint">
            Both empty: all past dates. Narrow with From / To.
          </p>

          <label className="filter-label" htmlFor="past-filter-location">
            Location
          </label>
          <input
            id="past-filter-location"
            className="input"
            type="text"
            placeholder="City, venue, ZIP…"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />

          <button type="button" className="btn btn-secondary btn-block" style={{ marginTop: "0.75rem" }} onClick={clearFilters}>
            Clear filters
          </button>
        </aside>

        <section className="card card-pad-lg">
          <div className="events-main__head">
            <h2>Past events</h2>
            <div className="events-main__sort-wrap">
              <label className="events-main__sort-label" htmlFor="past-event-sort">
                Sort
              </label>
              <select
                id="past-event-sort"
                className="select events-main__sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort past events"
              >
                <option value="date_asc">Date (earliest first)</option>
                <option value="date_desc">Date (latest first)</option>
                <option value="title_asc">Title A–Z</option>
                <option value="title_desc">Title Z–A</option>
              </select>
            </div>
          </div>
          <p className="page-lede" style={{ marginBottom: "1rem" }}>
            Admin archive: all events that ended before today (any approval status). Open a card for details.
          </p>
          {loading ? <p className="text-muted">Loading past events…</p> : null}
          {error ? <p className="text-error">{error}</p> : null}
          {!loading && !error && events.length === 0 ? (
            <p className="text-muted">No past events match your filters.</p>
          ) : null}
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
