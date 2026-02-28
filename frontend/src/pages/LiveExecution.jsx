import { useEffect, useState } from "react";
import axios from "axios";

export default function LiveExecution() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      const res = await axios.get("/api/dashboard", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (res.data?.devices) {
        setEvents(res.data.devices);
      }
    };

    fetchEvents();
    const interval = setInterval(fetchEvents, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="page-container">
      <h2>Live Execution</h2>

      {events.map((e, i) => (
        <div key={i} className="live-card">
          <strong>{e.device_id}</strong>
          <div>Risk: {e.risk_score}</div>
          <div>Execution: {e.execution_target}</div>
          <div>Latency: {e.latency} ms</div>
        </div>
      ))}
    </div>
  );
}