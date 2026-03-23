import { motion } from "framer-motion";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useState, useEffect } from "react";

export default function Layout() {

  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const saved = localStorage.getItem("theme") || "dark";
    setTheme(saved);

    document.body.classList.remove("dark", "light");
    document.body.classList.add(saved);
  }, []);

  function toggleTheme() {
    const newTheme = theme === "dark" ? "light" : "dark";

    setTheme(newTheme);

    document.body.classList.remove("dark", "light");
    document.body.classList.add(newTheme);

    localStorage.setItem("theme", newTheme);
  }

  return (
    <div className="app-container">

      {/* Sidebar */}
      <Sidebar />

      {/* Main Area */}
      <div className="main-content">

        {/* TOPBAR */}
        <div className="topbar">
          <div className="topbar-left">
            <h2>FOGNET-X Dashboard</h2>
            <span className="status">● Live</span>
          </div>

          <div className="topbar-right">
            <input
  className="search"
  placeholder="Search..."
  disabled
/>
            {/* THEME BUTTON */}
            <button onClick={toggleTheme}>
              {theme === "dark" ? "☀️": "🌙"}
            </button>

            <button
  className="upgrade-btn"
  onClick={() => alert("Pro plan coming soon!!!")}
>
  Upgrade
            </button>
          </div>
        </div>

        {/* PAGE CONTENT */}
        <motion.div
          className="page-content"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Outlet />
        </motion.div>

      </div>
    </div>
  );
}
