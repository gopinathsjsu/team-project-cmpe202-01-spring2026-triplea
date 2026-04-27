export default function EventCard({ title = "Event Title", event_description = "Event description placeholder" }) {
  return (
    <article style={{ border: "1px solid #ccc", padding: "10px", minHeight: "120px" }}>
      <div style={{ height: "48px", background: "#f3f3f3", marginBottom: "8px" }} />
      <h4 style={{ margin: 0 }}>{title}</h4>
      <p style={{ margin: "6px 0 0 0" }}>{event_description}</p>
    </article>
  );
}
