export default function DashboardPage() {
  return (
    <main style={{ display: "grid", gridTemplateColumns: "220px 1fr", minHeight: "100vh" }}>
      <aside style={{ borderRight: "1px solid #ddd", padding: "12px" }}>
        <h3>EventHub</h3>
        <p>Dashboard</p>
        <p>My Events</p>
        <p>Attendees</p>
        <p>Tickets</p>
        <p>Profile</p>
      </aside>

      <section style={{ padding: "16px" }}>
        <h2>Welcome back</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "16px" }}>
          <div style={{ border: "1px solid #ddd", padding: "10px" }}>Events Created</div>
          <div style={{ border: "1px solid #ddd", padding: "10px" }}>Total Attendees</div>
          <div style={{ border: "1px solid #ddd", padding: "10px" }}>Attendance Rate</div>
          <div style={{ border: "1px solid #ddd", padding: "10px" }}>Upcoming Events</div>
        </div>

        <section style={{ border: "1px solid #ddd", padding: "12px", marginBottom: "12px" }}>
          <h3>My Events</h3>
          <p>Event row placeholders</p>
        </section>

        <section style={{ border: "1px solid #ddd", padding: "12px" }}>
          <h3>Upcoming Events</h3>
          <p>Upcoming event placeholders</p>
        </section>
      </section>
    </main>
  );
}
