import { useState } from "react";
import { useNavigate } from "react-router-dom";
// import logo from "../assets/logo.png";
import logo from "../assets/fognetx-logo.svg";

export default function Login({ setToken }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();

    const res = await fetch("http://localhost:8000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.msg || "Login failed");
      return;
    }

    localStorage.setItem("token", data.access_token);
    setToken(data.access_token);
    navigate("/overview");
  }

  function handleGoogleLogin() {
    window.location.href = "http://localhost:8000/login/google";
  }

  return (
    <div className="auth-container">

      {/* LEFT PANEL */}
      <div className="auth-left">
        <div className="auth-brand">
          <div className="logo-stack">
          <img src={logo} alt="FOGNET-X Logo" className="logo" />
          <h1>FOGNET-X</h1>
          </div>
          <p>Fog-Cloud Orchestration Platform</p>

          <div className="auth-tagline">
            <h2>Orchestrate Smarter.</h2>
            <h2>Execute Faster.</h2>
            <h2>Deploy Anywhere.</h2>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="auth-right">
        <div className="auth-card">
          <h2>Welcome Back</h2>
          <p className="auth-sub">Sign in to your orchestration console</p>

          <form onSubmit={handleLogin} className="auth-form">
            <input
              type="text"
              placeholder="Username or Email"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button type="submit" className="btn-primary">
              Login
            </button>
          </form>

          <div className="divider">
            <span>OR</span>
          </div>

          <button className="btn-google" onClick={handleGoogleLogin}>
  <img
    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
    alt="Google"
    className="google-icon"
  />
  Continue with Google
</button>
        </div>
      </div>

    </div>
  );
}