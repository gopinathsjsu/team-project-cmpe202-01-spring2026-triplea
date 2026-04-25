import { useState } from "react";
import { login } from "../services/authService";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const response = await login(email, password);
    console.log(response);
  }

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
          <form onSubmit={handleSubmit}>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              style={{ width: "100%", marginBottom: "8px" }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              style={{ width: "100%", marginBottom: "8px" }}
            />
            <button type="submit" style={{ width: "100%" }}>
              Login
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
