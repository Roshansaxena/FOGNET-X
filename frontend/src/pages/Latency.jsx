import { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from "recharts";

export default function Latency() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchLatency = async () => {
      const res = await axios.get("/api/dashboard", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      const d = res.data;

      setData([
        {
          name: "Fog",
          avg: d.avg_fog_latency,
          p95: d.p95_fog_latency
        },
        {
          name: "Cloud",
          avg: d.avg_cloud_latency,
          p95: d.p95_cloud_latency
        }
      ]);
    };

    fetchLatency();
  }, []);

  return (
    <div className="page-container">
      <h2>Latency Analysis</h2>

      <LineChart width={600} height={300} data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="avg" stroke="#22c55e" />
        <Line type="monotone" dataKey="p95" stroke="#3b82f6" />
      </LineChart>
    </div>
  );
}