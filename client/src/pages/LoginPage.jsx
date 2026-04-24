export default function LoginPage() {
  return (
    <main style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "100vh" }}>
      <section style={{ padding: "32px", borderRight: "1px solid #ddd" }}>
        <h1>EventHub</h1>
        <div style={{ height: "220px", background: "#f3f3f3", margin: "20px 0" }} />
        <h2>Discover. Connect. Attend.</h2>
        <p>Find and create amazing events near you.</p>
      </section>

      <section style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "24px" }}>
        <div style={{ width: "100%", maxWidth: "360px", border: "1px solid #ccc", padding: "20px" }}>
          <h3>Login / Register</h3>
          <input type="email" placeholder="Email address" style={{ width: "100%", marginBottom: "8px" }} />
          <input type="password" placeholder="Password" style={{ width: "100%", marginBottom: "8px" }} />
          <button type="button" style={{ width: "100%", marginBottom: "8px" }}>
            Login
          </button>
          <button type="button" style={{ width: "100%" }}>
            Register
          </button>
        </div>
      </section>
    </main>
  );
}
