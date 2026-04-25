import EventCard from "../components/EventCard";

export default function EventListPage() {
  return (
    <main>
      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: "16px", padding: "16px" }}>
        <aside style={{ border: "1px solid #ddd", padding: "12px" }}>
          <h3>Filters</h3>
          <p>Category</p>
          <p>Date</p>
          <p>Location</p>
          <p>Price</p>
        </aside>

        <section>
          <h2>Popular Events</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "12px" }}>
            <EventCard />
            <EventCard />
            <EventCard />
            <EventCard />
            <EventCard />
            <EventCard />
          </div>
        </section>
      </div>
    </main>
  );
}
