export default function CreateEventPage() {
  return (
    <main>
      <section style={{ padding: "16px" }}>
        <h2>Create Event</h2>
        <p>Steps: 1) Basics 2) Details 3) Location 4) Review</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "16px" }}>
          <div style={{ border: "1px solid #ddd", padding: "12px" }}>
            <h3>Step 1 of 4</h3>
            <input type="text" placeholder="Event Title" style={{ width: "100%", marginBottom: "8px" }} />
            <input type="text" placeholder="Category" style={{ width: "100%", marginBottom: "8px" }} />
            <input type="text" placeholder="Date & Time" style={{ width: "100%", marginBottom: "8px" }} />
            <input type="number" placeholder="Capacity" style={{ width: "100%" }} />
          </div>

          <div style={{ border: "1px dashed #bbb", padding: "12px" }}>
            <h3>Event Image</h3>
            <div style={{ height: "120px", background: "#f3f3f3", marginBottom: "8px" }} />
            <button type="button">Upload</button>
          </div>
        </div>
      </section>
    </main>
  );
}
