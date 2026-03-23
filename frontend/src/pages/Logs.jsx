import { useEffect, useState } from "react";
import axios from "axios";

export default function Logs() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      const res = await axios.get("api/logs", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      setLogs(res.data || []);
    };

    fetchLogs();
  }, []);

  return (
    <div className="card">
  <h3>System Logs</h3>

  <div className="log">
    <span>[12:01:22]</span> esp1 → Fog Execution
  </div>

  <div className="log">
    <span>[12:01:25]</span> esp3 → Cloud Execution
  </div>
</div>
  );
}
