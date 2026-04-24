import RSVPButton from "../components/RSVPButton";

export default function EventDetailPage() {
  return (
    <main>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "16px", padding: "16px" }}>
        <section>
          <div style={{ height: "220px", background: "#f3f3f3", marginBottom: "12px" }} />
          <h2>Tech Conference 2025</h2>
          <p>Date / Time / Location / Organizer</p>
          <h3>About</h3>
          <p>Event description placeholder content.</p>
          <h3>Organizer</h3>
          <p>Organizer info placeholder.</p>
        </section>

        <aside style={{ border: "1px solid #ddd", padding: "12px" }}>
          <h3>FREE</h3>
          <p>Spots left: 42 / 100</p>
          <RSVPButton />
          <button type="button" style={{ marginTop: "8px", width: "100%" }}>
            Add to Calendar
          </button>
          <p style={{ marginTop: "12px" }}>Share / Attendees placeholders</p>
        </aside>
      </div>
    </main>
  );
}
