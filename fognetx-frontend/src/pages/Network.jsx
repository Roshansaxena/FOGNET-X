import { useEffect, useState } from "react";
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from "recharts";

const COLORS = ["#22c55e", "#3b82f6", "#facc15"];

export default function Network() {
  const [bandwidth, setBandwidth] = useState({});
  const [allocation, setAllocation] = useState({});
  const [formatted, setFormatted] = useState("");

  useEffect(() => {
    const fetchNetwork = async () => {
      const res = await axios.get("http://localhost:8000/api/dashboard", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      setBandwidth(res.data.bandwidth || {});
      setAllocation(res.data.allocation_summary || {});
      setFormatted(res.data.formatted_bandwidth || "");
    };

    fetchNetwork();
  }, []);

  const allocationData = [
    { name: "Fog", value: allocation.fog || 0 },
    { name: "Cloud", value: allocation.cloud || 0 },
    { name: "Hybrid", value: allocation.hybrid || 0 }
  ];

  return (
    <div className="page-container">
      <h2>Network & Bandwidth</h2>

      <div className="device-card">
        <strong>Total Bandwidth</strong>
        <div>{formatted}</div>
        <div>Raw Bytes: {bandwidth.total_bytes}</div>
      </div>

      <h3>Traffic Allocation Distribution</h3>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={allocationData}
            dataKey="value"
            nameKey="name"
            outerRadius={100}
          >
            {allocationData.map((entry, index) => (
              <Cell key={index} fill={COLORS[index]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}