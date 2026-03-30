import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { 
  FileText, Download, RefreshCw, Search, Filter, 
  AlertCircle, Info, CheckCircle, Server, Cloud, Zap 
} from "lucide-react";

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/logs", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const data = res.data || [];
      setLogs(data);
      setFilteredLogs(data);
    } catch (err) {
      console.error("Failed to fetch logs", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let filtered = logs;
    if (searchQuery) {
      filtered = filtered.filter(log => 
        log.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.device_id?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (filter !== "all") {
      filtered = filtered.filter(log => log.level === filter);
    }
    setFilteredLogs(filtered);
  }, [searchQuery, filter, logs]);

  const getLogIcon = (level, decision) => {
    if (level === "error") return <AlertCircle className="w-4 h-4 text-rose-400" />;
    if (level === "warning") return <AlertCircle className="w-4 h-4 text-amber-400" />;
    if (decision?.includes("FOG")) return <Server className="w-4 h-4 text-emerald-400" />;
    if (decision?.includes("CLOUD")) return <Cloud className="w-4 h-4 text-blue-400" />;
    if (decision?.includes("HYBRID")) return <Zap className="w-4 h-4 text-purple-400" />;
    return <Info className="w-4 h-4 text-slate-400" />;
  };

  const getLogColor = (level) => {
    if (level === "error") return "border-l-rose-500";
    if (level === "warning") return "border-l-amber-500";
    return "border-l-slate-500";
  };

  const exportLogs = () => {
    const csv = [
      ["Timestamp", "Level", "Device", "Message", "Decision"].join(","),
      ...logs.map(log => [
        log.timestamp,
        log.level,
        log.device_id,
        `"${log.message}"`,
        log.decision
      ].join(","))
    ].join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fognetx-logs-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">System Logs</h1>
          <p className="text-slate-400 mt-1">Monitor system events and decisions</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchLogs}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button 
            onClick={exportLogs}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Logs", value: logs.length, color: "text-white" },
          { label: "Errors", value: logs.filter(l => l.level === "error").length, color: "text-rose-400" },
          { label: "Warnings", value: logs.filter(l => l.level === "warning").length, color: "text-amber-400" },
          { label: "Info", value: logs.filter(l => l.level === "info").length, color: "text-emerald-400" },
        ].map((stat) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-4 text-center"
          >
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-sm text-slate-400">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">All Levels</option>
              <option value="error">Error</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs List */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No logs found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/50">
              {filteredLogs.map((log, i) => (
                <div 
                  key={i} 
                  className={`p-4 hover:bg-white/5 transition-colors border-l-4 ${getLogColor(log.level)}`}
                >
                  <div className="flex items-start gap-3">
                    {getLogIcon(log.level, log.decision)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-xs text-slate-500 font-mono">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          log.level === "error" ? "bg-rose-500/20 text-rose-400" :
                          log.level === "warning" ? "bg-amber-500/20 text-amber-400" :
                          "bg-slate-700 text-slate-300"
                        }`}>
                          {log.level?.toUpperCase()}
                        </span>
                        {log.device_id && (
                          <span className="text-xs text-indigo-400">{log.device_id}</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-300">{log.message}</p>
                      {log.decision && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs text-slate-500">Decision:</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            log.decision.includes("FOG") ? "bg-emerald-500/20 text-emerald-400" :
                            log.decision.includes("CLOUD") ? "bg-blue-500/20 text-blue-400" :
                            "bg-purple-500/20 text-purple-400"
                          }`}>
                            {log.decision}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
