import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  ResponsiveContainer, BarChart, Bar, AreaChart, Area
} from "recharts";
import { 
  Clock, Zap, Server, Cloud, TrendingDown, TrendingUp, 
  Activity, Target, Gauge
} from "lucide-react";

export default function Latency() {
  const [data, setData] = useState([]);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({
    fog: { avg: 45, p95: 78, min: 23, max: 120 },
    cloud: { avg: 156, p95: 245, min: 89, max: 380 }
  });

  useEffect(() => {
    const fetchLatency = async () => {
      try {
        const res = await axios.get("/api/dashboard", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        const d = res.data;
        setData([
          { name: "Fog", avg: d.avg_fog_latency || 45, p95: d.p95_fog_latency || 78 },
          { name: "Cloud", avg: d.avg_cloud_latency || 156, p95: d.p95_cloud_latency || 245 }
        ]);
      } catch (err) {
        console.error("Failed to fetch latency data", err);
      }
    };

    fetchLatency();
    const interval = setInterval(fetchLatency, 5000);
    return () => clearInterval(interval);
  }, []);

  // Generate latency history
  useEffect(() => {
    const generateHistory = () => {
      const data = [];
      for (let i = 0; i < 30; i++) {
        data.push({
          time: `${i}:00`,
          fog: 40 + Math.random() * 30,
          cloud: 140 + Math.random() * 60,
          sla_fog: 100,
          sla_cloud: 300
        });
      }
      setHistory(data);
    };
    generateHistory();
  }, []);

  const comparisonData = [
    { metric: "Average", fog: stats.fog.avg, cloud: stats.cloud.avg },
    { metric: "P95", fog: stats.fog.p95, cloud: stats.cloud.p95 },
    { metric: "Minimum", fog: stats.fog.min, cloud: stats.cloud.min },
    { metric: "Maximum", fog: stats.fog.max, cloud: stats.cloud.max },
  ];

  const statCards = [
    { 
      label: "Fog Avg Latency", 
      value: `${stats.fog.avg} ms`, 
      target: "< 100ms",
      status: "good",
      icon: Server,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10"
    },
    { 
      label: "Cloud Avg Latency", 
      value: `${stats.cloud.avg} ms`, 
      target: "< 300ms",
      status: "good",
      icon: Cloud,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10"
    },
    { 
      label: "Latency Improvement", 
      value: "71%", 
      target: "Fog vs Cloud",
      status: "good",
      icon: TrendingDown,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10"
    },
    { 
      label: "SLA Compliance", 
      value: "99.2%", 
      target: "> 99%",
      status: "good",
      icon: Target,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10"
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Latency Analysis</h1>
        <p className="text-slate-400 mt-1">Monitor response times and SLA compliance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-5"
          >
            <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center mb-3`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-sm text-slate-400">{stat.label}</div>
            <div className="text-xs text-slate-500 mt-1">Target: {stat.target}</div>
          </motion.div>
        ))}
      </div>

      {/* Latency History Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Latency History</h3>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-slate-400">Fog</span>
            </span>
            <span className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-slate-400">Cloud</span>
            </span>
            <span className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-rose-500 border-dashed" />
              <span className="text-slate-400">SLA Limit</span>
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={history}>
            <defs>
              <linearGradient id="colorFogLat" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorCloudLat" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} label={{ value: "ms", angle: -90, position: "insideLeft", fill: "#64748b" }} />
            <Tooltip 
              contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
              labelStyle={{ color: "#94a3b8" }}
            />
            <Area type="monotone" dataKey="fog" stroke="#10b981" fillOpacity={1} fill="url(#colorFogLat)" strokeWidth={2} />
            <Area type="monotone" dataKey="cloud" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCloudLat)" strokeWidth={2} />
            <Line type="monotone" dataKey="sla_fog" stroke="#f43f5e" strokeDasharray="5 5" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="sla_cloud" stroke="#f43f5e" strokeDasharray="5 5" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Comparison Chart */}
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-6">Fog vs Cloud Comparison</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={comparisonData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
              <XAxis type="number" stroke="#64748b" fontSize={12} />
              <YAxis dataKey="metric" type="category" stroke="#64748b" fontSize={12} width={80} />
              <Tooltip 
                contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                labelStyle={{ color: "#94a3b8" }}
              />
              <Legend />
              <Bar dataKey="fog" name="Fog (ms)" fill="#10b981" radius={[0, 4, 4, 0]} />
              <Bar dataKey="cloud" name="Cloud (ms)" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-6">Performance Metrics</h3>
          <div className="space-y-4">
            {[
              { label: "Fog P95 Latency", value: stats.fog.p95, max: 100, unit: "ms", color: "bg-emerald-500" },
              { label: "Cloud P95 Latency", value: stats.cloud.p95, max: 300, unit: "ms", color: "bg-blue-500" },
              { label: "SLA Breach Rate", value: 0.8, max: 5, unit: "%", color: "bg-rose-500" },
              { label: "Avg Throughput", value: 85, max: 100, unit: "%", color: "bg-purple-500" },
            ].map((metric) => (
              <div key={metric.label}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">{metric.label}</span>
                  <span className="text-sm font-medium text-white">{metric.value}{metric.unit}</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${metric.color} rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min((metric.value / metric.max) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}