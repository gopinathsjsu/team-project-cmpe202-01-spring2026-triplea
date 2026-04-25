export default function AdminPanelPage() {
  return (
    <main style={{ display: "grid", gridTemplateColumns: "220px 1fr", minHeight: "100vh" }}>
      <aside style={{ borderRight: "1px solid #ddd", padding: "12px" }}>
        <h3>EventHub Admin</h3>
        <p>Dashboard</p>
        <p>Events</p>
        <p>Approvals</p>
        <p>Users</p>
        <p>Reports</p>
      </aside>

      <section style={{ padding: "16px" }}>
        <h2>Event Approvals</h2>
        <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
          <input type="text" placeholder="Search events..." />
          <select>
            <option>Pending</option>
            <option>Approved</option>
            <option>Rejected</option>
          </select>
        </div>
        <div style={{ border: "1px solid #ddd", padding: "12px" }}>
          <p>Approval list/table placeholder</p>
        </div>
      </section>
    </main>
  );
}
