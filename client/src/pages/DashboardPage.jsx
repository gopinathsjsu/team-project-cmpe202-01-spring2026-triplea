export default function DashboardPage() {
  const userName = sessionStorage.getItem("eventhubUserName") || "User";

  return (
    <main style={{ display: "grid", gridTemplateColumns: "220px 1fr", minHeight: "calc(100vh - 56px)" }}>
      <aside style={{ borderRight: "1px solid #ddd", padding: "12px", background: "#fcfcfc" }}>
        <h3>EventHub</h3>
        <p>Dashboard</p>
        <p>My Events</p>
        <p>Attendees</p>
        <p>Tickets</p>
        <p>Saved Events</p>
        <p>Profile</p>
        <p>Settings</p>
      </aside>

      <section style={{ padding: "16px", display: "grid", gap: "12px" }}>
        <h2>Welcome back, {userName}!</h2>
        <p style={{ margin: 0 }}>Here&apos;s a quick snapshot of your events.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "16px" }}>
          <div style={{ border: "1px solid #ddd", padding: "10px" }}>3 Events Created</div>
          <div style={{ border: "1px solid #ddd", padding: "10px" }}>250 Total Attendees</div>
          <div style={{ border: "1px solid #ddd", padding: "10px" }}>85% Attendance Rate</div>
          <div style={{ border: "1px solid #ddd", padding: "10px" }}>2 Upcoming Events</div>
        </div>

        <section style={{ border: "1px solid #ddd", padding: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0 }}>My Events</h3>
            <button type="button">View all</button>
          </div>
          <div style={{ marginTop: "10px", border: "1px solid #eee", padding: "8px" }}>Tech Conference 2025 - 120 / 150 attendees</div>
          <div style={{ marginTop: "8px", border: "1px solid #eee", padding: "8px" }}>Startup Meetup - 60 / 80 attendees</div>
          <div style={{ marginTop: "8px", border: "1px solid #eee", padding: "8px" }}>AI Workshop - 70 / 100 attendees</div>
        </section>

        <section style={{ border: "1px solid #ddd", padding: "12px" }}>
          <h3>Upcoming Events</h3>
          <div style={{ border: "1px solid #eee", padding: "8px" }}>Summer Music Fest - starts in 17 days</div>
        </section>
      </section>
    </main>
  );
}
