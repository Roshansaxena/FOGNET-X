import { useEffect, useState } from "react";
import axios from "axios";

export default function Devices() {
  const [devices, setDevices] = useState([]);
  const [system, setSystem] = useState({});

  useEffect(() => {
    const fetchDevices = async () => {
      const res = await axios.get("api/dashboard", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      setDevices(res.data.devices || []);
      setSystem(res.data.system || {});
    };

    fetchDevices();
  }, []);

  return (
    <div className="page-container">
      <h2>Fog Node Status</h2>

      <div className="device-card">
        <strong>System Resources</strong>
        <div>CPU Usage: {system.cpu}%</div>
        <div>Memory Usage: {system.memory}%</div>
      </div>

      <h3>Connected Devices</h3>

      {devices.map((d, i) => (
        <div key={i} className="device-card">
          <strong>{d.device_id}</strong>
          <div>Temperature: {d.temperature}</div>
          <div>Gas: {d.gas}</div>
          <div>Severity: {d.severity}</div>
        </div>
      ))}
    </div>
  );
}