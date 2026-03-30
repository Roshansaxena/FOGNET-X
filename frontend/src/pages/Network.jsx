import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid
} from "recharts";
import { 
  Wifi, Download, Upload, Activity, Server, Cloud, Zap,
  ArrowUpRight, ArrowDownRight, Globe, Signal
} from "lucide-react";

const COLORS = ["#10b981", "#3b82f6", "#a855f7"];

export default function Network() {
  const [bandwidth, setBandwidth] = useState({});
  const [allocation, setAllocation] = useState({});
  const [formatted, setFormatted] = useState("");
  const [networkStats, setNetworkStats] = useState({
    latency: 45,
    packetLoss: 0.3,
    throughput: 1250,
    connections: 24
  });
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchNetwork = async () => {
      try {
        const res = await axios.get("api/dashboard", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        setBandwidth(res.data.bandwidth || {});
        setAllocation(res.data.allocation_summary || {});
        setFormatted(res.data.formatted_bandwidth || "");
      } catch (err) {
        console.error("Failed to fetch network data", err);
      }
    };

    fetchNetwork();
    const interval = setInterval(fetchNetwork, 5000);
    return () => clearInterval(interval);
  }, []);

  // Simulate network history
  useEffect(() => {
    const generateHistory = () => {
      const data = [];
      for (let i = 0; i < 20; i++) {
        data.push({
          time: `${i}:00`,
          fog: 800 + Math.random() * 400,
          cloud: 600 + Math.random() * 300,
          total: 1400 + Math.random() * 700
        });
      }
      setHistory(data);
    };
    generateHistory();
  }, []);

  const allocationData = [
    { name: "Fog Traffic", value: allocation.fog || 45, icon: Server },
    { name: "Cloud Traffic", value: allocation.cloud || 35, icon: Cloud },
    { name: "Hybrid Traffic", value: allocation.hybrid || 20, icon: Zap }
  ];

  const stats = [
    { 
      label: "Network Latency", 
      value: `${networkStats.latency} ms`, 
      change: "-12%", 
      trend: "down",
      icon: Activity,
      color: "text-emerald-400"
    },
    { 
      label: "Packet Loss", 
      value: `${networkStats.packetLoss}%`, 
      change: "-0.1%", 
      trend: "down",
      icon: Signal,
      color: "text-emerald-400"
    },
    { 
      label: "Throughput", 
      value: `${networkStats.throughput} KB/s`, 
      change: "+8%", 
      trend: "up",
      icon: Wifi,
      color: "text-blue-400"
    },
    { 
      label: "Active Connections", 
      value: networkStats.connections, 
      change: "+3", 
      trend: "up",
      icon: Globe,
      color: "text-purple-400"
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Network & Bandwidth</h1>
        <p className="text-slate-400 mt-1">Monitor network performance and traffic distribution</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <span className={`flex items-center gap-1 text-xs ${
                stat.trend === "up" ? "text-emerald-400" : "text-rose-400"
              }`}>
                {stat.trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {stat.change}
              </span>
            </div>
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-sm text-slate-400">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Bandwidth Overview */}
      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 glass-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Bandwidth Usage</h3>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-slate-400">Fog</span>
              </span>
              <span className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-slate-400">Cloud</span>
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={history}>
              <defs>
                <linearGradient id="colorFog" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorCloud" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
                labelStyle={{ color: "#94a3b8" }}
              />
              <Area type="monotone" dataKey="fog" stroke="#10b981" fillOpacity={1} fill="url(#colorFog)" />
              <Area type="monotone" dataKey="cloud" stroke="#3b82f6" fillOpacity={1} fill="url(#colorCloud)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-6">Traffic Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={allocationData}
                dataKey="value"
                nameKey="name"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
              >
                {allocationData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px" }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {allocationData.map((item, i) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-sm text-slate-400">{item.name}</span>
                </div>
                <span className="text-sm font-medium text-white">{item.value}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bandwidth Details */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-6">Bandwidth Details</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-4 rounded-xl bg-slate-800/50">
            <div className="flex items-center gap-3 mb-2">
              <Download className="w-5 h-5 text-emerald-400" />
              <span className="text-slate-400">Total Received</span>
            </div>
            <div className="text-2xl font-bold text-white">{formatted || "2.4 GB"}</div>
            <div className="text-sm text-slate-500 mt-1">{bandwidth.total_bytes?.toLocaleString() || "2,456,789,012"} bytes</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/50">
            <div className="flex items-center gap-3 mb-2">
              <Upload className="w-5 h-5 text-blue-400" />
              <span className="text-slate-400">Total Sent</span>
            </div>
            <div className="text-2xl font-bold text-white">1.8 GB</div>
            <div className="text-sm text-slate-500 mt-1">1,876,543,210 bytes</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/50">
            <div className="flex items-center gap-3 mb-2">
              <Wifi className="w-5 h-5 text-purple-400" />
              <span className="text-slate-400">Current Speed</span>
            </div>
            <div className="text-2xl font-bold text-white">12.5 Mbps</div>
            <div className="text-sm text-slate-500 mt-1">Peak: 45.2 Mbps</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
