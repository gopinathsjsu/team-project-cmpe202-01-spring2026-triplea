export default function CreateEventPage() {
  return (
    <main style={{ padding: "16px" }}>
      <section style={{ border: "1px solid #ddd", padding: "16px" }}>
        <h2 style={{ marginBottom: "6px" }}>Create Event</h2>
        <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
          <div style={{ border: "1px solid #bbb", background: "#eee", padding: "4px 10px" }}>1 Basics</div>
          <div style={{ border: "1px solid #ddd", padding: "4px 10px" }}>2 Details</div>
          <div style={{ border: "1px solid #ddd", padding: "4px 10px" }}>3 Location</div>
          <div style={{ border: "1px solid #ddd", padding: "4px 10px" }}>4 Review</div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "16px" }}>
          <div style={{ border: "1px solid #ddd", padding: "12px" }}>
            <h3>Step 1 of 4</h3>
            <p style={{ marginTop: 0 }}>Let&apos;s start with the basics.</p>
            <input type="text" placeholder="Event Title" style={{ width: "100%", marginBottom: "8px", padding: "8px" }} />
            <textarea
              name="event_description"
              placeholder="Event Description"
              style={{ width: "100%", marginBottom: "8px", padding: "8px", minHeight: "80px", resize: "vertical" }}
            />
            <select style={{ width: "100%", marginBottom: "8px", padding: "8px" }}>
              <option>Select a category</option>
            </select>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
              <input type="text" placeholder="Date" style={{ width: "100%", padding: "8px" }} />
              <input type="text" placeholder="Time" style={{ width: "100%", padding: "8px" }} />
            </div>
            <input type="number" placeholder="Capacity (e.g. 100)" style={{ width: "100%", padding: "8px" }} />
          </div>

          <div style={{ border: "1px dashed #bbb", padding: "12px", background: "#fcfcfc" }}>
            <h3>Event Image</h3>
            <div style={{ height: "120px", background: "#f3f3f3", marginBottom: "8px" }} />
            <button type="button">Upload</button>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
          <button type="button">Next</button>
        </div>
      </section>
    </main>
  );
}
