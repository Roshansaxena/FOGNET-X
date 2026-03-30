import { useEffect, useState } from "react";
import { fetchDashboard } from "../services/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
  CartesianGrid,
  BarChart,
  Bar
} from "recharts";
import { 
  Cpu, 
  Activity, 
  AlertTriangle, 
  Zap, 
  Server, 
  HardDrive, 
  Network, 
  Thermometer,
  Wind,
  Droplets,
  Gauge,
  TrendingUp,
  Shield,
  AlertCircle,
  CheckCircle,
  Clock,
  Database,
  Wifi,
  Battery,
  Signal
} from "lucide-react";

// Professional chart colors
const CHART_COLORS = {
  primary: "#6366f1",
  success: "#10b981",
  warning: "#f59e0b",
  danger: "#ef4444",
  info: "#3b82f6",
  purple: "#8b5cf6",
  cyan: "#06b6d4",
  pink: "#ec4899"
};

const PIE_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444"];
const GRADIENT_COLORS = [
  { from: "#6366f1", to: "#8b5cf6" },
  { from: "#10b981", to: "#34d399" },
  { from: "#f59e0b", to: "#fbbf24" }
];

// Enhanced Metric Card with trend indicator - ULTRA COMPACT
function MetricCard({ title, value, sub, icon: Icon, colorClass, delay = 0, trend = null }) {
  return (
    <motion.div
      className="glass-card p-3 relative overflow-hidden group hover:shadow-md hover:shadow-indigo-500/10 transition-all duration-300 border border-slate-700/50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.01 }}
    >
      {/* Background gradient effect */}
      <div className={`absolute -right-3 -top-3 w-16 h-16 rounded-full opacity-5 group-hover:opacity-10 transition-opacity ${colorClass.replace('text-', 'bg-')}`}></div>
      
      <div className="flex justify-between items-start mb-1">
        <div className="flex items-center gap-1.5">
          <div className={`p-1.5 rounded-md bg-gradient-to-br from-white/5 to-white/10 border border-white/10 ${colorClass}`}>
             <Icon size={14} strokeWidth={2} />
          </div>
          <div>
            <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{title}</h4>
            {trend && (
              <div className={`flex items-center gap-0.5 text-[9px] ${trend > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                <TrendingUp size={8} className={trend < 0 ? 'rotate-180' : ''} />
                <span>{Math.abs(trend)}%</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="relative z-10">
        <h2 className="text-xl font-bold text-white mb-0 tracking-tight">{value}</h2>
        <p className="text-[9px] text-slate-500 flex items-center gap-0.5">
          <Clock size={8} />
          {sub}
        </p>
      </div>
    </motion.div>
  );
}

// Ultra-compact Sensor Data Card component
function SensorCard({ title, value, unit, icon: Icon, status = 'normal', delay = 0 }) {
  const statusColors = {
    normal: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
    warning: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
    critical: 'border-rose-500/30 bg-rose-500/10 text-rose-400'
  };
  
  return (
    <motion.div
      className={`p-2.5 rounded-lg border ${statusColors[status]} hover:shadow-md transition-all duration-300`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <Icon size={12} className="opacity-70" />
          <span className="text-[9px] font-semibold uppercase tracking-wider opacity-70">{title}</span>
        </div>
        <div className={`w-1.5 h-1.5 rounded-full ${status === 'normal' ? 'bg-emerald-400' : status === 'warning' ? 'bg-amber-400' : 'bg-rose-400'} animate-pulse`} />
      </div>
      <div className="text-base font-bold text-white leading-tight">
        {value !== undefined && value !== null ? value : '--'}<span className="text-[10px] opacity-60 ml-0.5">{unit}</span>
      </div>
    </motion.div>
  );
}

// Compact Device Health Gauge Component
function HealthGauge({ health, label, icon: Icon, delay = 0 }) {
  const color = health > 70 ? CHART_COLORS.success : health > 40 ? CHART_COLORS.warning : CHART_COLORS.danger;
  const r = 30;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (health / 100) * circumference;
  
  return (
    <motion.div
      className="glass-card p-4 flex flex-col items-center justify-center"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay }}
    >
      <div className="relative w-20 h-20 mb-2">
        <svg width="80" height="80" className="-rotate-90">
          <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
          <circle
            cx="40" cy="40" r={r} fill="none"
            stroke={color}
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-lg font-bold text-white">{health}%</div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-slate-300">
        <Icon size={14} />
        <span className="text-xs font-medium">{label}</span>
      </div>
    </motion.div>
  );
}

export default function Overview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  useEffect(() => {
    const load = () => {
      fetchDashboard()
        .then((res) => {
          setData(res);
          setLoading(false);
          setLastUpdate(new Date());
        })
        .catch((err) => {
          console.error("Dashboard fetch error:", err);
          setLoading(false);
        });
    };

    load(); 
    const interval = setInterval(load, 3000); // Faster updates for real-time feel
    return () => clearInterval(interval); 
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-full min-h-[600px]">
       <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Activity size={24} className="text-indigo-500" />
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-white mb-2">Loading FOGNET-X Dashboard</h3>
            <p className="text-slate-400">Connecting to fog node...</p>
          </div>
       </div>
    </div>
  );

  // Prepare enhanced data for charts
  const allocationData = [
    { name: "Fog", value: data.allocation_summary?.fog || 0, color: CHART_COLORS.success },
    { name: "Cloud", value: data.allocation_summary?.cloud || 0, color: CHART_COLORS.info },
    { name: "Hybrid", value: data.allocation_summary?.hybrid || 0, color: CHART_COLORS.warning }
  ];
  
  const totalAllocations = allocationData.reduce((sum, item) => sum + item.value, 0);
  
  // Get latest device data (first device in array or empty object)
  const latestDevice = data.devices?.[0] || {};
  
  // Health scores (simulated from system data)
  const deviceHealth = data.system?.health_score || 95;
  const networkQuality = data.system?.network_quality || 88;
  const slaCompliance = data.sla_compliance || 99;

  return (
    <div className="max-w-[1600px] mx-auto space-y-4">
      {/* Compact Header Section */}
      <motion.div 
        className="glass-card p-4 border border-slate-700/50 relative overflow-hidden"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-lg bg-indigo-500/20 border border-indigo-500/30">
                <Activity size={20} className="text-indigo-400" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">FOGNET-X Dashboard</h1>
            </div>
            <p className="text-xs text-slate-400 ml-0.5">Real-time edge orchestration</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Last Update</div>
              <div className="text-xs text-white font-mono">{lastUpdate.toLocaleTimeString()}</div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wide">Live</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Key Performance Metrics - Compact */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <MetricCard
          title="Total Events"
          value={data.total_events?.toLocaleString() || 0}
          sub="Processed events"
          icon={Activity}
          colorClass="text-blue-400"
          delay={0}
          trend={12}
        />
        <MetricCard
          title="Fog Latency"
          value={`${data.avg_fog_latency || 0}`}
          sub={`P95: ${data.p95_fog_latency || 0}ms`}
          icon={Zap}
          colorClass="text-emerald-400"
          delay={0.1}
          trend={-8}
        />
        <MetricCard
          title="Cloud Latency"
          value={`${data.avg_cloud_latency || 0}`}
          sub={`P95: ${data.p95_cloud_latency || 0}ms`}
          icon={Server}
          colorClass="text-indigo-400"
          delay={0.2}
        />
        <MetricCard
          title="SLA Compliance"
          value={`${slaCompliance}%`}
          sub={`${data.sla_violations || 0} violations`}
          icon={Shield}
          colorClass={slaCompliance > 95 ? "text-emerald-400" : "text-amber-400"}
          delay={0.3}
          trend={slaCompliance > 95 ? 2 : -5}
        />
        <MetricCard
          title="Bandwidth"
          value={data.formatted_bandwidth || "0 KB"}
          sub="Cloud traffic"
          icon={Network}
          colorClass="text-purple-400"
          delay={0.4}
        />
      </div>

      {/* Sensor Data & Device Health - Compact */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Live Sensor Readings */}
        <motion.div 
          className="lg:col-span-2 glass-card p-3 border border-slate-700/50 h-auto"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Cpu size={14} className="text-indigo-400" />
              Live Sensor Readings
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse ml-1" />
            </h3>
            <div className="text-[9px] text-slate-500">{lastUpdate.toLocaleTimeString()}</div>
          </div>
          
          {data.devices?.length > 0 ? (
            <div className="grid grid-cols-4 gap-1.5">
              <SensorCard
                title="Temp"
                value={latestDevice.temperature}
                unit="°C"
                icon={Thermometer}
                status={latestDevice.temperature > 50 ? 'critical' : latestDevice.temperature > 40 ? 'warning' : 'normal'}
                delay={0.3}
              />
              <SensorCard
                title="Humidity"
                value={latestDevice.humidity}
                unit="%"
                icon={Droplets}
                status="normal"
                delay={0.4}
              />
              <SensorCard
                title="Gas"
                value={latestDevice.gas}
                unit="ppm"
                icon={Wind}
                status={latestDevice.gas > 500 ? 'critical' : latestDevice.gas > 300 ? 'warning' : 'normal'}
                delay={0.5}
              />
              <SensorCard
                title="Pressure"
                value={latestDevice.pressure}
                unit="hPa"
                icon={Gauge}
                status="normal"
                delay={0.6}
              />
              <SensorCard
                title="Tank"
                value={latestDevice.tank_level ? Math.round(latestDevice.tank_level) : null}
                unit="%"
                icon={Database}
                status={latestDevice.tank_level > 95 ? 'critical' : latestDevice.tank_level > 80 ? 'warning' : 'normal'}
                delay={0.7}
              />
              <SensorCard
                title="Motion"
                value={latestDevice.motion ? 'ON' : 'OFF'}
                unit=""
                icon={Activity}
                status={latestDevice.motion ? 'warning' : 'normal'}
                delay={0.8}
              />
              <SensorCard
                title="Power"
                value={latestDevice.power_consumption}
                unit="W"
                icon={Zap}
                status="normal"
                delay={0.9}
              />
              <SensorCard
                title="Network"
                value={latestDevice.network_latency ? Math.round(latestDevice.network_latency) : null}
                unit="ms"
                icon={Wifi}
                status={latestDevice.network_latency > 100 ? 'warning' : 'normal'}
                delay={1.0}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center py-8 text-slate-500 text-sm">
              <Activity className="w-4 h-4 mr-2 animate-pulse" />
              Waiting for sensor data...
            </div>
          )}
        </motion.div>
        
        {/* Device & Network Health - Compact */}
        <motion.div 
          className="glass-card p-4 border border-slate-700/50"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Shield size={16} className="text-emerald-400" />
              System Health
            </h3>
          </div>
          
          <div className="space-y-2">
            <HealthGauge
              health={deviceHealth}
              label="Device"
              icon={Cpu}
              delay={0.4}
            />
            <HealthGauge
              health={networkQuality}
              label="Network"
              icon={Wifi}
              delay={0.5}
            />
            <HealthGauge
              health={slaCompliance}
              label="SLA"
              icon={CheckCircle}
              delay={0.6}
            />
          </div>
        </motion.div>
      </div>

      {/* MAIN CHARTS - Compact */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        
        {/* Risk Trend Chart */}
        <motion.div 
          className="lg:col-span-2 glass-card p-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex justify-between items-center mb-3">
             <div>
                <h3 className="text-sm font-semibold text-white">Risk Trajectory</h3>
                <span className="text-[10px] text-slate-400">Last 20 windows</span>
             </div>
             <div className="flex gap-2">
                <span className="px-2 py-1 bg-white/5 rounded text-[10px] text-slate-300 border border-white/10">Live</span>
             </div>
          </div>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.risk_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis 
                  dataKey="index" 
                  tick={{ fill: "#64748b", fontSize: 12 }} 
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: "#64748b", fontSize: 12 }} 
                  axisLine={false}
                  tickLine={false}
                />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px border rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="risk_score" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRisk)" 
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#c084fc' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Allocation Donut Chart - Compact */}
        <motion.div 
          className="glass-card p-4 flex flex-col"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="mb-2">
            <h3 className="text-sm font-bold text-white">Task Distribution</h3>
            <p className="text-[10px] text-slate-400">Fog vs Cloud</p>
          </div>
          <div className="flex-1 min-h-[180px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  <linearGradient id="fogGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#34d399" stopOpacity={1}/>
                  </linearGradient>
                  <linearGradient id="cloudGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#60a5fa" stopOpacity={1}/>
                  </linearGradient>
                  <linearGradient id="hybridGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#fbbf24" stopOpacity={1}/>
                  </linearGradient>
                </defs>
                <Pie
                  data={allocationData}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  paddingAngle={3}
                  stroke="none"
                >
                  {allocationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`url(${index === 0 ? '#fogGradient' : index === 1 ? '#cloudGradient' : '#hybridGradient'})`} />
                  ))}
                </Pie>
                <RechartsTooltip 
                   contentStyle={{ 
                     backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                     border: '1px solid rgba(255,255,255,0.1)', 
                     borderRadius: '8px',
                     backdropFilter: 'blur(8px)',
                     fontSize: '12px'
                   }}
                   itemStyle={{ color: '#fff', fontSize: '12px' }}
                />
                {/* Center text */}
                <text x="50%" y="50%" textAnchor="middle" className="fill-white text-xl font-bold" style={{ fontSize: '20px' }}>
                  {totalAllocations}
                </text>
                <text x="50%" y="60%" textAnchor="middle" className="fill-slate-400 text-[10px]" style={{ fontSize: '10px' }}>
                  Tasks
                </text>
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend - Compact */}
          <div className="mt-2 space-y-1">
            {allocationData.map((item, index) => (
              <div key={item.name} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-emerald-500' : index === 1 ? 'bg-blue-500' : 'bg-amber-500'}`}></div>
                  <span className="text-slate-300 text-[10px]">{item.name}</span>
                </div>
                <div className="text-xs font-semibold text-white">
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

      </div>

      {/* HARDWARE METRICS */}
      <h2 className="text-xl font-bold text-white mb-4 mt-10 flex items-center gap-2">
         <HardDrive size={22} className="text-indigo-400" /> Edge Node Telemetry
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="CPU Usage"
          value={`${data.system?.cpu || 0}%`}
          sub="Fog node core utilization"
          icon={Cpu}
          colorClass="text-amber-400"
        />
        <MetricCard
          title="Memory Usage"
          value={`${data.system?.memory || 0}%`}
          sub="Fog node RAM allocation"
          icon={HardDrive}
          colorClass="text-cyan-400"
        />
        <MetricCard
          title="Cloud Bytes"
          value={`${data.bandwidth?.cloud_bytes || 0} B`}
          sub="Egress window volume"
          icon={Network}
          colorClass="text-indigo-400"
        />
        <MetricCard
          title="Fog Bytes"
          value={`${data.bandwidth?.fog_bytes || 0} B`}
          sub="Ingress window volume"
          icon={Activity}
          colorClass="text-emerald-400"
        />
      </div>

    </div>
  );
}