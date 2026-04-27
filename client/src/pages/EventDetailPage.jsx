import RSVPButton from "../components/RSVPButton";

export default function EventDetailPage() {
  return (
    <main style={{ padding: "16px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "16px", alignItems: "start" }}>
        <section style={{ border: "1px solid #ddd", padding: "12px" }}>
          <div style={{ border: "1px solid #ddd", padding: "8px", marginBottom: "12px", background: "#fff" }}>
            <div style={{ height: "210px", background: "#f3f3f3" }} />
          </div>
          <h2 style={{ marginBottom: "6px" }}>Tech Conference 2025</h2>
          <p style={{ marginTop: 0 }}>Sat, May 24, 2025 | 10:00 AM - 4:00 PM | Metro Toronto Convention Centre</p>
          <h3>About</h3>
          <p>Join industry leaders and innovators for a day of insightful talks and networking.</p>
          <h3>Organizer</h3>
          <p>Hosted by TechTalks.</p>
          <h3>Attendees</h3>
          <p>120 people are going.</p>
        </section>

        <aside style={{ border: "1px solid #ddd", padding: "12px", background: "#fcfcfc" }}>
          <h3>FREE</h3>
          <p>Spots left: 42 / 100</p>
          <RSVPButton />
          <button type="button" style={{ marginTop: "8px", width: "100%" }}>
            Add to Calendar
          </button>
          <hr style={{ margin: "12px 0" }} />
          <p style={{ marginBottom: "8px" }}>Share this event</p>
          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
            <button type="button">f</button>
            <button type="button">x</button>
            <button type="button">in</button>
          </div>
          <p style={{ marginBottom: "6px" }}>People going</p>
          <div style={{ display: "flex", gap: "6px" }}>
            <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#ddd", display: "inline-block" }} />
            <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#ddd", display: "inline-block" }} />
            <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#ddd", display: "inline-block" }} />
            <span style={{ width: "24px", height: "24px", borderRadius: "50%", background: "#ddd", display: "inline-block" }} />
          </div>
        </aside>
      </div>
    </main>
  );
}
