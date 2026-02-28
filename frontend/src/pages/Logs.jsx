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
    <div className="page-container">
      <h2>Cloud Logs</h2>
      <pre className="logs-box">{logs.join("")}</pre>
    </div>
  );
}