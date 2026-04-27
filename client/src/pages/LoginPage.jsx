import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/authService";

export default function LoginPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoginError("");

    try {
      const response = await login(email, password);
      console.log(response);

      if (response?.success) {
        const fullName = response?.data?.user?.full_name;
        if (fullName) {
          sessionStorage.setItem("eventhubUserName", fullName);
        }
        navigate("/dashboard");
      } else {
        const errorMessage = response?.message || "Login failed";
        console.error(errorMessage);
        setLoginError(errorMessage);
      }
    } catch (error) {
      console.error(error);
      setLoginError(error?.message || "Login failed");
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "10px",
    border: "1px solid #cfcfcf",
    marginBottom: "10px",
    boxSizing: "border-box",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        background: "#f8f8f8",
      }}
    >
      <section
        style={{
          padding: "40px",
          borderRight: "1px solid #ddd",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: "16px",
          background: "#ffffff",
        }}
      >
        <h1 style={{ margin: 0 }}>EventHub SJSU</h1>
        <p style={{ margin: 0, color: "#555" }}>Welcome back to your campus event hub.</p>
        <div
          style={{
            height: "260px",
            border: "1px dashed #c7c7c7",
            background: "#f7f7f7",
            display: "grid",
            placeItems: "center",
            color: "#999",
          }}
        >
          Hero placeholder
        </div>
        <h2 style={{ marginBottom: 0 }}>Discover. Connect. Attend.</h2>
        <p style={{ marginTop: 0, maxWidth: "430px" }}>
          Find campus and local events, connect with people, and create your own experiences.
        </p>
      </section>

      <section
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "24px",
          background: "#fcfcfc",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "380px",
            border: "1px solid #ccc",
            padding: "20px",
            background: "#fff",
          }}
        >
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
            <button
              type="button"
              onClick={() => setActiveTab("login")}
              style={{
                flex: 1,
                padding: "8px",
                border: "1px solid #bbb",
                background: activeTab === "login" ? "#eee" : "#fff",
                cursor: "pointer",
              }}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("register")}
              style={{
                flex: 1,
                padding: "8px",
                border: "1px solid #ddd",
                background: activeTab === "register" ? "#eee" : "#fff",
                cursor: "pointer",
              }}
            >
              Register
            </button>
          </div>

          <form onSubmit={onSubmit}>
            {activeTab === "register" ? (
              <>
                <label htmlFor="name" style={{ display: "block", marginBottom: "6px", fontSize: "14px" }}>
                  Full name
                </label>
                <input id="name" type="text" placeholder="Your name" style={inputStyle} />
              </>
            ) : null}
            <label htmlFor="email" style={{ display: "block", marginBottom: "6px", fontSize: "14px" }}>
              Email address
            </label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              style={inputStyle}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <label htmlFor="password" style={{ display: "block", marginBottom: "6px", fontSize: "14px" }}>
              Password
            </label>
            <input
              id="password"
              type="password"
              placeholder="Enter password"
              style={inputStyle}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              type="submit"
              style={{ width: "100%", marginBottom: "10px", padding: "10px", border: "1px solid #bbb", cursor: "pointer" }}
            >
              {activeTab === "login" ? "Login" : "Create account"}
            </button>
            {loginError ? (
              <p style={{ margin: "0 0 10px 0", color: "#b00020", fontSize: "13px" }}>
                {loginError}
              </p>
            ) : null}
            {activeTab === "login" ? (
              <>
                <button
                  type="button"
                  style={{
                    margin: "0 0 8px 0",
                    fontSize: "13px",
                    textAlign: "right",
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    textDecoration: "underline",
                    cursor: "pointer",
                  }}
                >
                  Forgot password?
                </button>
                <p style={{ margin: 0, fontSize: "13px", textAlign: "center" }}>
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setActiveTab("register")}
                    style={{ border: "none", background: "transparent", textDecoration: "underline", cursor: "pointer", padding: 0 }}
                  >
                    Register
                  </button>
                </p>
              </>
            ) : (
              <p style={{ margin: 0, fontSize: "13px", textAlign: "center" }}>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setActiveTab("login")}
                  style={{ border: "none", background: "transparent", textDecoration: "underline", cursor: "pointer", padding: 0 }}
                >
                  Login
                </button>
              </p>
            )}
          </form>
        </div>
      </section>
    </main>
  );
}
