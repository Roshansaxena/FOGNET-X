import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { 
  Settings, Activity, Server, Cloud, Cpu, Zap, Shield, 
  TrendingUp, AlertTriangle, CheckCircle, Clock, Database 
} from "lucide-react";

export default function Orchestration() {
  const [state, setState] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const fetchState = async () => {
    try {
      const res = await axios.get("api/orchestration/state", { headers });
      setState(res.data);
    } catch (err) {
      console.error("Failed to fetch orchestration state", err);
    }
  };

  const fetchRecent = async () => {
    try {
      const res = await axios.get("/api/orchestration/recent", { headers });
      setRecent(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch recent decisions", err);
    }
  };

  const updateConfig = async () => {
    try {
      await axios.post("api/orchestration/config", {
        mode: state.mode,
        risk_threshold: state.risk_threshold,
        sla_fog_ms: state.sla_fog_ms,
        sla_cloud_ms: state.sla_cloud_ms,
        cpu_threshold: state.cpu_threshold
      }, { headers });
      alert("Configuration Updated");
    } catch (err) {
      console.error("Failed to update config", err);
    }
  };

  useEffect(() => {
    fetchState();
    fetchRecent();
    const interval = setInterval(() => {
      fetchState();
      fetchRecent();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!state) return (
    <div className="flex items-center justify-center h-96">
      <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
    </div>
  );

  const totalAlloc = state.allocation.FOG_EXECUTION + state.allocation.CLOUD_EXECUTION + state.allocation.FOG_AND_CLOUD;
  const fogPercent = totalAlloc ? ((state.allocation.FOG_EXECUTION / totalAlloc) * 100).toFixed(1) : 0;
  const cloudPercent = totalAlloc ? ((state.allocation.CLOUD_EXECUTION / totalAlloc) * 100).toFixed(1) : 0;
  const hybridPercent = totalAlloc ? ((state.allocation.FOG_AND_CLOUD / totalAlloc) * 100).toFixed(1) : 0;

  const getDecisionIcon = (decision) => {
    if (decision.includes("FOG")) return <Server className="w-4 h-4" />;
    if (decision.includes("CLOUD")) return <Cloud className="w-4 h-4" />;
    return <Zap className="w-4 h-4" />;
  };

  const getDecisionColor = (decision) => {
    if (decision.includes("FOG")) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    if (decision.includes("CLOUD")) return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    return "bg-purple-500/20 text-purple-400 border-purple-500/30";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Orchestration Control</h1>
          <p className="text-slate-400 mt-1">Manage execution policies and monitor system performance</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-sm text-emerald-400 font-medium">System Active</span>
        </div>
      </div>

      {/* Configuration Card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
            <Settings className="w-5 h-5 text-indigo-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">Configuration</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-sm text-slate-400">Execution Mode</label>
            <select
              value={state.mode}
              onChange={(e) => setState({ ...state, mode: e.target.value })}
              className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="dynamic">Dynamic (Auto)</option>
              <option value="force_fog">Force Fog</option>
              <option value="force_cloud">Force Cloud</option>
              <option value="hybrid">Hybrid Only</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-400">Risk Threshold: {state.risk_threshold}</label>
            <input
              type="range" min="0" max="1" step="0.01"
              value={state.risk_threshold}
              onChange={(e) => setState({ ...state, risk_threshold: parseFloat(e.target.value) })}
              className="w-full accent-indigo-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-400">SLA Fog (ms)</label>
            <input
              type="number" value={state.sla_fog_ms}
              onChange={(e) => setState({ ...state, sla_fog_ms: parseInt(e.target.value) })}
              className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-400">SLA Cloud (ms)</label>
            <input
              type="number" value={state.sla_cloud_ms}
              onChange={(e) => setState({ ...state, sla_cloud_ms: parseInt(e.target.value) })}
              className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <button 
          onClick={updateConfig}
          className="mt-6 px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors"
        >
          Apply Changes
        </button>
      </motion.div>

      {/* Metrics Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <span className="text-slate-400">CPU Usage</span>
          </div>
          <div className="text-3xl font-bold text-white">{state.fog_cpu}%</div>
          <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${state.fog_cpu}%` }} />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-5 h-5 text-blue-400" />
            <span className="text-slate-400">Memory Usage</span>
          </div>
          <div className="text-3xl font-bold text-white">{state.memory_usage}%</div>
          <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${state.memory_usage}%` }} />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-5 h-5 text-rose-400" />
            <span className="text-slate-400">SLA Pressure</span>
          </div>
          <div className="text-3xl font-bold text-white">{(state.sla_pressure * 100).toFixed(1)}%</div>
          <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${
                state.sla_pressure > 0.2 ? "bg-rose-500" : state.sla_pressure > 0.1 ? "bg-amber-500" : "bg-emerald-500"
              }`} 
              style={{ width: `${state.sla_pressure * 100}%` }} 
            />
          </div>
        </motion.div>
      </div>

      {/* Allocation Distribution */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Execution Distribution</h3>
        <div className="space-y-4">
          {[
            { label: "Fog Execution", value: fogPercent, color: "bg-emerald-500", icon: Server },
            { label: "Cloud Execution", value: cloudPercent, color: "bg-blue-500", icon: Cloud },
            { label: "Hybrid Execution", value: hybridPercent, color: "bg-purple-500", icon: Zap },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-4">
              <item.icon className="w-5 h-5 text-slate-400" />
              <span className="w-32 text-sm text-slate-400">{item.label}</span>
              <div className="flex-1 h-8 bg-slate-800/50 rounded-lg overflow-hidden">
                <div 
                  className={`h-full ${item.color} rounded-lg transition-all duration-500 flex items-center justify-end px-3`}
                  style={{ width: `${item.value}%` }}
                >
                  <span className="text-sm font-semibold text-white">{item.value}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Recent Decisions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Recent Decisions</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Device</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Risk</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Decision</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Latency</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((d, i) => (
                <tr key={i} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4 text-white font-medium">{d.device_id}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      d.risk > 0.7 ? "bg-rose-500/20 text-rose-400" : 
                      d.risk > 0.4 ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"
                    }`}>
                      {(d.risk * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getDecisionColor(d.decision)}`}>
                      {getDecisionIcon(d.decision)}
                      {d.decision.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400">{d.latency} ms</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1.5 text-sm ${d.sla_breach ? "text-rose-400" : "text-emerald-400"}`}>
                      {d.sla_breach ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      {d.sla_breach ? "Breach" : "OK"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
