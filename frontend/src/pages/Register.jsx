import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      await axios.post("/api/register", {
        username,
        password
      });

      alert("User registered!");
      navigate("/login");
    } catch (err) {
      alert("User already exists");
    }
  };

  return (
    <div className="loginScreen">
      <div className="loginBox">
        <h2>Register</h2>

        <input
          placeholder="Username"
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={handleRegister}>
          Register
        </button>
      </div>
    </div>
  );
}
