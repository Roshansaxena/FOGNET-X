import { useEffect, useState } from "react";
import axios from "axios";


export default function LiveExecution() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get("/api/dashboard", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        console.log("DATA:", res.data);

        if (res.data?.devices) {
          setEvents([...res.data.devices]);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchEvents();
    const interval = setInterval(fetchEvents, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid-2">
      {events
  .filter((d) =>
    d.device_id.toLowerCase().includes(search.toLowerCase())
  ).map((d, i) => (
  <div className="card device-card" key={i}>

    <div className="device-header">
      <h3>{d.device_id}</h3>
      <span className="live-dot">●</span>
    </div>

    <p>
      Gas Level:
      <span className="risk-pill">{d.gas}</span>
    </p>

    <p>
      Status:
      <span className={`decision-badge ${d.severity}`}>
        {d.severity}
      </span>
    </p>

    <p>
      Temperature: {d.temperature} °C
    </p>

  </div>
))}
    </div>
  );
}
