import { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, Search, Server, Cloud, Zap, Thermometer, 
  Wind, Droplets, Gauge, AlertTriangle, CheckCircle, 
  Wifi, Battery, Signal
} from "lucide-react";

export default function LiveExecution() {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedDevice, setSelectedDevice] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await axios.get("/api/dashboard", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
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

  const getSeverityColor = (severity) => {
    if (severity === "CRITICAL") return "bg-rose-500/20 text-rose-400 border-rose-500/30";
    if (severity === "WARNING") return "bg-amber-500/20 text-amber-400 border-amber-500/30";
    return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
  };

  const getDecisionIcon = (decision) => {
    if (decision?.includes("FOG")) return <Server className="w-4 h-4" />;
    if (decision?.includes("CLOUD")) return <Cloud className="w-4 h-4" />;
    return <Zap className="w-4 h-4" />;
  };

  const filteredEvents = events.filter((d) =>
    d.device_id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Live Execution</h1>
          <p className="text-slate-400 mt-1">Real-time device monitoring and execution tracking</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-sm text-emerald-400 font-medium">Live</span>
          <span className="text-sm text-slate-500">{events.length} devices active</span>
        </div>
      </div>

      {/* Search */}
      <div className="glass-card p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search devices..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Device Grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence>
          {filteredEvents.map((device, i) => (
            <motion.div
              key={device.device_id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedDevice(device)}
              className="glass-card p-5 cursor-pointer hover:border-indigo-500/30 transition-all group"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{device.device_id}</h3>
                    <p className="text-xs text-slate-400">
                      {device.timestamp ? new Date(device.timestamp).toLocaleTimeString() : "--:--:--"}
                    </p>
                  </div>
                </div>
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getSeverityColor(device.severity)}`}>
                  {device.severity}
                </span>
                {device.decision && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-slate-700 text-slate-300">
                    {getDecisionIcon(device.decision)}
                    {device.decision.replace(/_/g, " ")}
                  </span>
                )}
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-800/50">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                    <Thermometer className="w-3 h-3" />
                    Temperature
                  </div>
                  <div className="text-lg font-semibold text-white">
                    {device.temperature != null ? Number(device.temperature).toFixed(1) : "--"}°C
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/50">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                    <Wind className="w-3 h-3" />
                    Gas Level
                  </div>
                  <div className="text-lg font-semibold text-white">{device.gas != null ? device.gas : "--"}</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/50">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                    <Droplets className="w-3 h-3" />
                    Humidity
                  </div>
                  <div className="text-lg font-semibold text-white">
                    {device.humidity != null ? Number(device.humidity).toFixed(1) : "--"}%
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-slate-800/50">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                    <Gauge className="w-3 h-3" />
                    Pressure
                  </div>
                  <div className="text-lg font-semibold text-white">
                    {device.pressure != null ? Number(device.pressure).toFixed(0) : "--"} hPa
                  </div>
                </div>
              </div>

              {/* Risk Score */}
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Risk Score</span>
                  <span className={`font-semibold ${
                    (device.risk || 0) > 0.7 ? "text-rose-400" : (device.risk || 0) > 0.4 ? "text-amber-400" : "text-emerald-400"
                  }`}>
                    {((device.risk || 0) * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      (device.risk || 0) > 0.7 ? "bg-rose-500" : (device.risk || 0) > 0.4 ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${(device.risk || 0) * 100}%` }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-12">
          <Activity className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No devices found</p>
        </div>
      )}

      {/* Device Detail Modal */}
      <AnimatePresence>
        {selectedDevice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedDevice(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card p-6 max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">{selectedDevice.device_id}</h2>
                <button 
                  onClick={() => setSelectedDevice(null)}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <span className="text-slate-400">✕</span>
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Temperature", value: selectedDevice.temperature != null ? `${Number(selectedDevice.temperature).toFixed(1)}°C` : "--", icon: Thermometer },
                    { label: "Gas Level", value: selectedDevice.gas != null ? selectedDevice.gas : "--", icon: Wind },
                    { label: "Humidity", value: selectedDevice.humidity != null ? `${Number(selectedDevice.humidity).toFixed(1)}%` : "--", icon: Droplets },
                    { label: "Pressure", value: selectedDevice.pressure != null ? `${Number(selectedDevice.pressure).toFixed(0)} hPa` : "--", icon: Gauge },
                    { label: "Motion", value: selectedDevice.motion ? "Detected" : "None", icon: Activity },
                    { label: "Tank Level", value: selectedDevice.tank_level != null ? `${Number(selectedDevice.tank_level).toFixed(1)}%` : "--", icon: Signal },
                  ].map((item) => (
                    <div key={item.label} className="p-4 rounded-lg bg-slate-800/50">
                      <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                        <item.icon className="w-4 h-4" />
                        {item.label}
                      </div>
                      <div className="text-lg font-semibold text-white">{item.value}</div>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-lg bg-slate-800/50">
                  <div className="text-sm text-slate-400 mb-2">Execution Decision</div>
                  <div className="flex items-center gap-2">
                    {getDecisionIcon(selectedDevice.decision)}
                    <span className="text-white font-medium">{selectedDevice.decision?.replace(/_/g, " ")}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
