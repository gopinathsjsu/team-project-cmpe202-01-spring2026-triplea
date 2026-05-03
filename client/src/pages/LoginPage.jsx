import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login, register } from "../services/authService";

export default function LoginPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registerRole, setRegisterRole] = useState("attendee");
  const [loginError, setLoginError] = useState("");

  const persistSessionAndGo = (response) => {
    const token = response?.data?.token;
    if (!token) {
      setLoginError("No token was returned. Please try again.");
      return;
    }
    localStorage.setItem("token", token);

    const name = response?.data?.user?.full_name;
    if (name) {
      sessionStorage.setItem("eventhubUserName", name);
    }
    navigate("/dashboard");
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoginError("");

    try {
      if (activeTab === "login") {
        const response = await login(email, password);
        persistSessionAndGo(response);
        return;
      }

      const trimmedName = fullName.trim();
      if (!trimmedName) {
        setLoginError("Full name is required.");
        return;
      }

      const response = await register({
        full_name: trimmedName,
        email,
        password,
        role: registerRole,
      });
      persistSessionAndGo(response);
    } catch (error) {
      setLoginError(error?.message || "Something went wrong.");
    }
  };

  return (
    <main className="login-page">
      <section className="login-hero">
        <h1>EventHub SJSU</h1>
        <p className="login-hero__lede">Your campus event hub — discover talks, meetups, and more.</p>
        <div className="login-hero__visual" aria-hidden />
        <h2>Discover. Connect. Attend.</h2>
        <p>
          Find campus and local events, meet organizers, and RSVP in one place.
        </p>
      </section>

      <section className="login-panel-wrap">
        <div className="card login-card">
          <div className="login-tabs">
            <button
              type="button"
              className={`login-tab ${activeTab === "login" ? "login-tab--active" : ""}`}
              onClick={() => {
                setActiveTab("login");
                setLoginError("");
              }}
            >
              Log in
            </button>
            <button
              type="button"
              className={`login-tab ${activeTab === "register" ? "login-tab--active" : ""}`}
              onClick={() => {
                setActiveTab("register");
                setLoginError("");
              }}
            >
              Register
            </button>
          </div>

          <form onSubmit={onSubmit} className="form-stack">
            {activeTab === "register" ? (
              <>
                <label htmlFor="name" className="label">
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  className="input"
                  placeholder="Your name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                  style={{ marginBottom: "0.75rem" }}
                />
                <fieldset className="fieldset-box">
                  <legend>Account type</legend>
                  <label className="radio-row">
                    <input
                      type="radio"
                      name="registerRole"
                      value="attendee"
                      checked={registerRole === "attendee"}
                      onChange={() => setRegisterRole("attendee")}
                    />
                    Attendee — browse and RSVP
                  </label>
                  <label className="radio-row">
                    <input
                      type="radio"
                      name="registerRole"
                      value="organizer"
                      checked={registerRole === "organizer"}
                      onChange={() => setRegisterRole("organizer")}
                    />
                    Organizer — create and manage events
                  </label>
                </fieldset>
              </>
            ) : null}
            <label htmlFor="email" className="label">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="input"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              style={{ marginBottom: "0.75rem" }}
              autoComplete="email"
            />
            <label htmlFor="password" className="label">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              style={{ marginBottom: "0.75rem" }}
              autoComplete={activeTab === "login" ? "current-password" : "new-password"}
            />
            <button type="submit" className="btn btn-primary btn-block">
              {activeTab === "login" ? "Log in" : "Create account"}
            </button>
            {loginError ? (
              <p className="text-error" style={{ margin: "0.75rem 0 0", fontSize: "0.875rem" }}>
                {loginError}
              </p>
            ) : null}
            {activeTab === "login" ? (
              <>
                <button type="button" className="link-btn" style={{ marginTop: "0.5rem", width: "100%", textAlign: "right" }}>
                  Forgot password?
                </button>
                <p className="login-footer-link">
                  Don&apos;t have an account?{" "}
                  <button type="button" className="link-btn" onClick={() => setActiveTab("register")}>
                    Register
                  </button>
                </p>
              </>
            ) : (
              <p className="login-footer-link">
                Already have an account?{" "}
                <button type="button" className="link-btn" onClick={() => setActiveTab("login")}>
                  Log in
                </button>
              </p>
            )}
            <p className="login-footer-link">
              <Link to="/events">Continue without an account →</Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
