export default function AdminPanelPage() {
  return (
    <main style={{ display: "grid", gridTemplateColumns: "220px 1fr", minHeight: "calc(100vh - 56px)" }}>
      <aside style={{ borderRight: "1px solid #ddd", padding: "12px", background: "#fcfcfc" }}>
        <h3>EventHub Admin</h3>
        <p>Dashboard</p>
        <p>Events</p>
        <p>Approvals</p>
        <p>Users</p>
        <p>Reports</p>
        <p>Categories</p>
        <p>Settings</p>
      </aside>

      <section style={{ padding: "16px", display: "grid", gap: "12px" }}>
        <h2>Event Approvals</h2>
        <p style={{ margin: 0 }}>Review and moderate organizer submissions.</p>
        <div style={{ border: "1px solid #ddd", padding: "10px", display: "flex", gap: "8px", alignItems: "center" }}>
          <button type="button">Pending</button>
          <button type="button">Approved</button>
          <button type="button">Rejected</button>
          <input type="text" placeholder="Search events..." style={{ marginLeft: "auto", padding: "6px" }} />
          <select style={{ padding: "6px" }}>
            <option>Pending</option>
            <option>Approved</option>
            <option>Rejected</option>
          </select>
        </div>

        <div style={{ border: "1px solid #ddd" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: "8px", padding: "10px", borderBottom: "1px solid #ddd", fontWeight: 600 }}>
            <div>Event</div>
            <div>Organizer</div>
            <div>Date</div>
            <div>Status</div>
            <div>Action</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: "8px", padding: "10px", borderBottom: "1px solid #eee" }}>
            <div>Night of Jazz</div>
            <div>Jazz Club</div>
            <div>May 20</div>
            <div>Pending</div>
            <div>
              <button type="button">Approve</button> <button type="button">Reject</button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: "8px", padding: "10px" }}>
            <div>Hackathon Summit</div>
            <div>CodeLab</div>
            <div>Jun 01</div>
            <div>Pending</div>
            <div>
              <button type="button">Approve</button> <button type="button">Reject</button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
