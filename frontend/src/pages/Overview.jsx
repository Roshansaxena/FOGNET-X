import { useEffect, useState } from "react";
import { fetchDashboard } from "../services/api";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

const COLORS = ["#22c55e", "#3b82f6", "#facc15"];

function MetricCard({ title, value, sub }) {
  return (
    <motion.div
      className="metric-card"
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.2 }}
    >
      <h4>{title}</h4>
      <h2>{value}</h2>
      <span>{sub}</span>
    </motion.div>
  );
}

export default function Overview() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const load = () => {
      fetchDashboard()
        .then(setData)
        .catch((err) => console.error("Dashboard fetch error:", err));
    };

    load(); // initial load
    const interval = setInterval(load, 5000); // refresh every 5 sec
    return () => clearInterval(interval); // cleanup
  }, []);

  if (!data) return <div style={{ padding: 20 }}>Loading dashboard...</div>;

  // Allocation Data for Pie Chart
  const allocationData = [
    { name: "Fog", value: data.allocation_summary?.fog || 0 },
    { name: "Cloud", value: data.allocation_summary?.cloud || 0 },
    { name: "Hybrid", value: data.allocation_summary?.hybrid || 0 }
  ];

  return (
    <div>
      <h1 style={{ marginBottom: 30 }}>System Overview</h1>

      {/* ============================= */}
      {/* ROW 1 — METRICS */}
      {/* ============================= */}

      <div className="metrics-grid">
        <MetricCard
          title="Total Events"
          value={data.total_events}
          sub="All-time processed"
        />

        <MetricCard
          title="Fog Latency"
          value={`${data.avg_fog_latency} ms`}
          sub={`P95: ${data.p95_fog_latency} ms`}
        />

        <MetricCard
          title="Cloud Latency"
          value={`${data.avg_cloud_latency} ms`}
          sub={`P95: ${data.p95_cloud_latency} ms`}
        />

        <MetricCard
          title="SLA Violations"
          value={data.sla_violations}
          sub="Total violations"
        />

        <MetricCard
          title="Cloud Bandwidth"
          value={data.formatted_bandwidth}
          sub="Application layer traffic"
        />
      </div>

      {/* ============================= */}
      {/* ROW 2 — CHARTS */}
      {/* ============================= */}

      <div className="chart-row">

        {/* Allocation Pie */}
        <div className="chart-card">
          <h3>Allocation Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={allocationData}
                dataKey="value"
                outerRadius={90}
                label
              >
                {allocationData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Trend */}
        <div className="chart-card">
          <h3>Risk Trend (Last 20)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.risk_trend}>
              <XAxis
                dataKey="index"
                tick={{ fill: "#94a3b8" }}
              />
              <YAxis tick={{ fill: "#94a3b8" }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="risk_score"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* ============================= */}
      {/* ROW 3 — SYSTEM HEALTH */}
      {/* ============================= */}

      <div className="metrics-grid" style={{ marginTop: 40 }}>
        <MetricCard
          title="CPU Usage"
          value={`${data.system?.cpu}%`}
          sub="Fog node CPU"
        />
        <MetricCard
          title="Memory Usage"
          value={`${data.system?.memory}%`}
          sub="Fog node RAM"
        />
        <MetricCard
          title="Cloud Bytes (Window)"
          value={`${data.bandwidth?.cloud_bytes || 0} B`}
          sub="Recent 200 events"
        />
        <MetricCard
          title="Fog Bytes (Window)"
          value={`${data.bandwidth?.fog_bytes || 0} B`}
          sub="Recent 200 events"
        />
      </div>

    </div>
  );
}

// import { useEffect } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { fetchDashboard } from "../services/api";
// import { initSocket } from "../services/socket";
// import {
//   handleMetricsEvent,
//   handleDecisionEvent
// } from "../core/eventProcessor";
//
// export default function Overview() {
//   const dispatch = useDispatch();
//   const data = useSelector((state) => state.metrics);
//
//   useEffect(() => {
//     const token = localStorage.getItem("token");
//
//     fetchDashboard()
//       .then((res) => handleMetricsEvent(dispatch, res))
//       .catch((err) => console.error(err));
//
//     const socket = initSocket(token);
//
//     socket.on("metrics_event", (payload) => {
//       handleMetricsEvent(dispatch, payload);
//     });
//
//     socket.on("decision_event", (payload) => {
//       handleDecisionEvent(dispatch, payload);
//     });
//
//     return () => socket.disconnect();
//   }, []);
//   if (!data) return <div>Loading...</div>;
//
//   const totalEvents = data.total_events ?? 0;
//   const fogAvg = data.fogLatency?.avg ?? 0;
//   const fogP95 = data.fogLatency?.p95 ?? 0;
//   const cloudAvg = data.cloudLatency?.avg ?? 0;
//   const cloudP95 = data.cloudLatency?.p95 ?? 0;
//
//   return (
//     <div style={{ padding: 20 }}>
//       <h1>System Overview</h1>
//
//       <div>Total Events: {totalEvents}</div>
//       <div>Fog Avg: {fogAvg} ms</div>
//       <div>Fog P95: {fogP95} ms</div>
//       <div>Cloud Avg: {cloudAvg} ms</div>
//       <div>Cloud P95: {cloudP95} ms</div>
//     </div>
//   );
// }