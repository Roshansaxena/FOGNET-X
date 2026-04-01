import { useEffect, useState, useCallback, useMemo } from "react";
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
  Signal,
  GripVertical,
  X,
  Settings,
  LayoutDashboard,
  Eye,
  EyeOff,
  RotateCcw,
  Lock,
  Unlock,
  Move,
  Maximize2,
  Minimize2
} from "lucide-react";
import { Responsive, WidthProvider } from 'react-grid-layout/legacy';
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveGridLayout = WidthProvider(Responsive);

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

// Storage keys
const LAYOUT_STORAGE_KEY = "fognet-dashboard-layout";
const HIDDEN_WIDGETS_KEY = "fognet-dashboard-hidden";

// Default layouts for different breakpoints
const DEFAULT_LAYOUTS = {
  lg: [
    { i: "metrics", x: 0, y: 0, w: 12, h: 3, minW: 6, minH: 3 },
    { i: "sensors", x: 0, y: 3, w: 8, h: 5, minW: 4, minH: 4 },
    { i: "health", x: 8, y: 3, w: 4, h: 5, minW: 3, minH: 4 },
    { i: "risk", x: 0, y: 8, w: 8, h: 7, minW: 4, minH: 5 },
    { i: "allocation", x: 8, y: 8, w: 4, h: 7, minW: 3, minH: 5 },
    { i: "telemetry", x: 0, y: 15, w: 12, h: 4, minW: 6, minH: 3 },
  ],
  md: [
    { i: "metrics", x: 0, y: 0, w: 10, h: 3, minW: 6, minH: 3 },
    { i: "sensors", x: 0, y: 3, w: 6, h: 5, minW: 4, minH: 4 },
    { i: "health", x: 6, y: 3, w: 4, h: 5, minW: 3, minH: 4 },
    { i: "risk", x: 0, y: 8, w: 6, h: 7, minW: 4, minH: 5 },
    { i: "allocation", x: 6, y: 8, w: 4, h: 7, minW: 3, minH: 5 },
    { i: "telemetry", x: 0, y: 15, w: 10, h: 4, minW: 6, minH: 3 },
  ],
  sm: [
    { i: "metrics", x: 0, y: 0, w: 6, h: 4, minW: 6, minH: 3 },
    { i: "sensors", x: 0, y: 4, w: 6, h: 5, minW: 4, minH: 4 },
    { i: "health", x: 0, y: 9, w: 6, h: 5, minW: 3, minH: 4 },
    { i: "risk", x: 0, y: 14, w: 6, h: 7, minW: 4, minH: 5 },
    { i: "allocation", x: 0, y: 21, w: 6, h: 7, minW: 3, minH: 5 },
    { i: "telemetry", x: 0, y: 28, w: 6, h: 4, minW: 6, minH: 3 },
  ],
};

// Widget definitions
const WIDGET_DEFS = {
  metrics: { title: "Key Performance Metrics", icon: Activity },
  sensors: { title: "Live Sensor Readings", icon: Cpu },
  health: { title: "System Health", icon: Shield },
  risk: { title: "Risk Trajectory", icon: TrendingUp },
  allocation: { title: "Task Distribution", icon: Gauge },
  telemetry: { title: "Edge Node Telemetry", icon: HardDrive },
};

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

// Widget wrapper with edit mode controls
function WidgetWrapper({ id, children, isEditMode, onRemove, title, icon: Icon }) {
  return (
    <div className="h-full flex flex-col glass-card border border-slate-700/50 overflow-hidden relative group/widget">
      {/* Edit mode overlay & controls */}
      {isEditMode && (
        <>
          {/* Drag handle bar */}
          <div 
            className="drag-handle absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-3 py-1.5 bg-indigo-500/20 backdrop-blur-sm border-b border-indigo-500/30 cursor-grab active:cursor-grabbing"
          >
            <div className="flex items-center gap-2">
              <GripVertical size={14} className="text-indigo-400" />
              <span className="text-[10px] font-semibold text-indigo-300 uppercase tracking-wider">
                {title}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(id); }}
                className="p-1 rounded hover:bg-rose-500/30 text-slate-400 hover:text-rose-400 transition-colors"
                title="Hide widget"
              >
                <EyeOff size={12} />
              </button>
            </div>
          </div>
          {/* Dashed outline for edit mode */}
          <div className="absolute inset-0 border-2 border-dashed border-indigo-500/30 rounded-2xl pointer-events-none z-10" />
        </>
      )}
      <div className={`flex-1 overflow-hidden ${isEditMode ? 'pt-8' : ''}`}>
        {children}
      </div>
    </div>
  );
}

export default function Overview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isEditMode, setIsEditMode] = useState(false);
  const [hiddenWidgets, setHiddenWidgets] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(HIDDEN_WIDGETS_KEY)) || [];
    } catch { return []; }
  });
  const [layouts, setLayouts] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LAYOUT_STORAGE_KEY));
      return saved || DEFAULT_LAYOUTS;
    } catch { return DEFAULT_LAYOUTS; }
  });
  const [showWidgetPanel, setShowWidgetPanel] = useState(false);

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
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval); 
  }, []);

  const onLayoutChange = useCallback((currentLayout, allLayouts) => {
    setLayouts(allLayouts);
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(allLayouts));
  }, []);

  const removeWidget = useCallback((widgetId) => {
    setHiddenWidgets(prev => {
      const updated = [...prev, widgetId];
      localStorage.setItem(HIDDEN_WIDGETS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const restoreWidget = useCallback((widgetId) => {
    setHiddenWidgets(prev => {
      const updated = prev.filter(id => id !== widgetId);
      localStorage.setItem(HIDDEN_WIDGETS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const resetLayout = useCallback(() => {
    setLayouts(DEFAULT_LAYOUTS);
    setHiddenWidgets([]);
    localStorage.removeItem(LAYOUT_STORAGE_KEY);
    localStorage.removeItem(HIDDEN_WIDGETS_KEY);
  }, []);

  // Filter layouts to only include visible widgets
  const filteredLayouts = useMemo(() => {
    const result = {};
    for (const [breakpoint, items] of Object.entries(layouts)) {
      result[breakpoint] = items.filter(item => !hiddenWidgets.includes(item.i));
    }
    return result;
  }, [layouts, hiddenWidgets]);

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
  const latestDevice = data.devices?.[0] || {};
  const deviceHealth = data.system?.health_score || 95;
  const networkQuality = data.system?.network_quality || 88;
  const slaCompliance = data.sla_compliance || 99;

  // Visible widget IDs
  const visibleWidgetIds = Object.keys(WIDGET_DEFS).filter(id => !hiddenWidgets.includes(id));

  return (
    <div className="max-w-[1600px] mx-auto">
      {/* Dashboard Header with Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <LayoutDashboard size={20} className="text-indigo-400" />
            <h1 className="text-lg font-bold text-white">Dashboard</h1>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wide">Live</span>
          </div>
          <span className="text-xs text-slate-500 font-mono">{lastUpdate.toLocaleTimeString()}</span>
        </div>

        <div className="flex items-center gap-2">
          {isEditMode && (
            <>
              {/* Widget visibility toggle */}
              <div className="relative">
                <button
                  onClick={() => setShowWidgetPanel(!showWidgetPanel)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 transition-colors text-xs font-medium"
                >
                  <Eye size={14} />
                  Widgets
                </button>

                {/* Widget panel dropdown */}
                <AnimatePresence>
                  {showWidgetPanel && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-64 bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl z-50 p-3"
                    >
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold mb-2 px-1">Toggle Widgets</div>
                      <div className="space-y-1">
                        {Object.entries(WIDGET_DEFS).map(([id, def]) => {
                          const isVisible = !hiddenWidgets.includes(id);
                          const WidgetIcon = def.icon;
                          return (
                            <button
                              key={id}
                              onClick={() => isVisible ? removeWidget(id) : restoreWidget(id)}
                              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                                isVisible 
                                  ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20' 
                                  : 'bg-slate-700/30 text-slate-500 border border-slate-700/30 hover:text-slate-300'
                              }`}
                            >
                              <WidgetIcon size={14} />
                              <span className="flex-1 text-left">{def.title}</span>
                              {isVisible ? <Eye size={12} /> : <EyeOff size={12} />}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Reset button */}
              <button
                onClick={resetLayout}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 hover:bg-amber-500/20 transition-colors text-xs font-medium"
                title="Reset to default layout"
              >
                <RotateCcw size={14} />
                Reset
              </button>
            </>
          )}

          {/* Edit mode toggle */}
          <button
            onClick={() => { setIsEditMode(!isEditMode); setShowWidgetPanel(false); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isEditMode 
                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' 
                : 'bg-slate-700/50 border border-slate-600/50 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
          >
            {isEditMode ? <><Lock size={14} /> Lock Dashboard</> : <><Settings size={14} /> Customize</>}
          </button>
        </div>
      </div>

      {/* Edit Mode Banner */}
      <AnimatePresence>
        {isEditMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
              <Move size={16} className="text-indigo-400" />
              <span className="text-xs text-indigo-300">
                <strong>Edit Mode:</strong> Drag widgets to rearrange • Resize from edges/corners • Click <EyeOff size={10} className="inline" /> to hide widgets
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Customizable Grid Layout */}
      <ResponsiveGridLayout
        className="layout"
        layouts={filteredLayouts}
        breakpoints={{ lg: 1200, md: 996, sm: 768 }}
        cols={{ lg: 12, md: 10, sm: 6 }}
        rowHeight={40}
        onLayoutChange={onLayoutChange}
        isDraggable={isEditMode}
        isResizable={isEditMode}
        draggableHandle=".drag-handle"
        containerPadding={[0, 0]}
        margin={[12, 12]}
        useCSSTransforms={true}
      >
        {/* Key Performance Metrics */}
        {!hiddenWidgets.includes("metrics") && (
          <div key="metrics">
            <WidgetWrapper id="metrics" isEditMode={isEditMode} onRemove={removeWidget} title="Key Metrics" icon={Activity}>
              <div className="p-3 h-full">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 h-full">
                  {[
                    { title: "Total Events", value: data.total_events?.toLocaleString() || 0, sub: "Processed events", icon: Activity, color: "text-blue-400", trend: 12 },
                    { title: "Fog Latency", value: `${data.avg_fog_latency || 0}`, sub: `P95: ${data.p95_fog_latency || 0}ms`, icon: Zap, color: "text-emerald-400", trend: -8 },
                    { title: "Cloud Latency", value: `${data.avg_cloud_latency || 0}`, sub: `P95: ${data.p95_cloud_latency || 0}ms`, icon: Server, color: "text-indigo-400" },
                    { title: "SLA Compliance", value: `${slaCompliance}%`, sub: `${data.sla_violations || 0} violations`, icon: Shield, color: slaCompliance > 95 ? "text-emerald-400" : "text-amber-400", trend: slaCompliance > 95 ? 2 : -5 },
                    { title: "Bandwidth", value: data.formatted_bandwidth || "0 KB", sub: "Cloud traffic", icon: Network, color: "text-purple-400" }
                  ].map((m, i) => (
                    <div key={i} className="glass-card p-3 relative overflow-hidden group border border-slate-700/50 hover:shadow-md hover:shadow-indigo-500/10 transition-all">
                      <div className={`absolute -right-3 -top-3 w-16 h-16 rounded-full opacity-5 group-hover:opacity-10 transition-opacity ${m.color.replace('text-', 'bg-')}`}></div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className={`p-1.5 rounded-md bg-gradient-to-br from-white/5 to-white/10 border border-white/10 ${m.color}`}>
                          <m.icon size={14} strokeWidth={2} />
                        </div>
                        <div>
                          <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{m.title}</h4>
                          {m.trend && (
                            <div className={`flex items-center gap-0.5 text-[9px] ${m.trend > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              <TrendingUp size={8} className={m.trend < 0 ? 'rotate-180' : ''} />
                              <span>{Math.abs(m.trend)}%</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <h2 className="text-xl font-bold text-white mb-0 tracking-tight">{m.value}</h2>
                      <p className="text-[9px] text-slate-500 flex items-center gap-0.5"><Clock size={8} />{m.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </WidgetWrapper>
          </div>
        )}

        {/* Live Sensor Readings */}
        {!hiddenWidgets.includes("sensors") && (
          <div key="sensors">
            <WidgetWrapper id="sensors" isEditMode={isEditMode} onRemove={removeWidget} title="Sensor Readings" icon={Cpu}>
              <div className="p-3 h-full flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Cpu size={14} className="text-indigo-400" />
                    Live Sensor Readings
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse ml-1" />
                  </h3>
                  <div className="text-[9px] text-slate-500">{lastUpdate.toLocaleTimeString()}</div>
                </div>
                {data.devices?.length > 0 ? (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 flex-1 content-start">
                    <SensorCard title="Temp" value={parseFloat(latestDevice.temperature || 0).toFixed(1)} unit="°C" icon={Thermometer}
                      status={latestDevice.temperature > 50 ? 'critical' : latestDevice.temperature > 40 ? 'warning' : 'normal'} delay={0.1} />
                    <SensorCard title="Humidity" value={parseFloat(latestDevice.humidity || 0).toFixed(1)} unit="%" icon={Droplets} status="normal" delay={0.15} />
                    <SensorCard title="Gas" value={parseFloat(latestDevice.gas || 0).toFixed(1)} unit="ppm" icon={Wind}
                      status={latestDevice.gas > 500 ? 'critical' : latestDevice.gas > 300 ? 'warning' : 'normal'} delay={0.2} />
                    <SensorCard title="Pressure" value={parseFloat(latestDevice.pressure || 0).toFixed(1)} unit="hPa" icon={Gauge} status="normal" delay={0.25} />
                    <SensorCard title="Tank" value={latestDevice.tank_level ? parseFloat(latestDevice.tank_level).toFixed(1) : null} unit="%"
                      icon={Database} status={latestDevice.tank_level > 95 ? 'critical' : latestDevice.tank_level > 80 ? 'warning' : 'normal'} delay={0.3} />
                    <SensorCard title="Motion" value={latestDevice.motion ? 'ON' : 'OFF'} unit="" icon={Activity}
                      status={latestDevice.motion ? 'warning' : 'normal'} delay={0.35} />
                    <SensorCard title="Power" value={parseFloat(latestDevice.power_consumption || 0).toFixed(1)} unit="W" icon={Zap} status="normal" delay={0.4} />
                    <SensorCard title="Network" value={latestDevice.network_latency ? parseFloat(latestDevice.network_latency).toFixed(1) : null}
                      unit="ms" icon={Wifi} status={latestDevice.network_latency > 100 ? 'warning' : 'normal'} delay={0.45} />
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8 text-slate-500 text-sm">
                    <Activity className="w-4 h-4 mr-2 animate-pulse" />
                    Waiting for sensor data...
                  </div>
                )}
              </div>
            </WidgetWrapper>
          </div>
        )}

        {/* System Health */}
        {!hiddenWidgets.includes("health") && (
          <div key="health">
            <WidgetWrapper id="health" isEditMode={isEditMode} onRemove={removeWidget} title="System Health" icon={Shield}>
              <div className="p-4 h-full flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Shield size={16} className="text-emerald-400" />
                    System Health
                  </h3>
                </div>
                <div className="flex-1 flex flex-col justify-around">
                  <HealthGauge health={deviceHealth} label="Device" icon={Cpu} delay={0.2} />
                  <HealthGauge health={networkQuality} label="Network" icon={Wifi} delay={0.3} />
                  <HealthGauge health={slaCompliance} label="SLA" icon={CheckCircle} delay={0.4} />
                </div>
              </div>
            </WidgetWrapper>
          </div>
        )}

        {/* Risk Trend Chart */}
        {!hiddenWidgets.includes("risk") && (
          <div key="risk">
            <WidgetWrapper id="risk" isEditMode={isEditMode} onRemove={removeWidget} title="Risk Trajectory" icon={TrendingUp}>
              <div className="p-4 h-full flex flex-col">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Risk Trajectory</h3>
                    <span className="text-[10px] text-slate-400">Last 20 windows</span>
                  </div>
                  <span className="px-2 py-1 bg-white/5 rounded text-[10px] text-slate-300 border border-white/10">Live</span>
                </div>
                <div className="flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.risk_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="index" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false} />
                      <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px border rgba(255,255,255,0.1)', borderRadius: '12px' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Area type="monotone" dataKey="risk_score" stroke="#8b5cf6" strokeWidth={3}
                        fillOpacity={1} fill="url(#colorRisk)" activeDot={{ r: 6, strokeWidth: 0, fill: '#c084fc' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </WidgetWrapper>
          </div>
        )}

        {/* Allocation Donut Chart */}
        {!hiddenWidgets.includes("allocation") && (
          <div key="allocation">
            <WidgetWrapper id="allocation" isEditMode={isEditMode} onRemove={removeWidget} title="Task Distribution" icon={Gauge}>
              <div className="p-4 h-full flex flex-col">
                <div className="mb-2">
                  <h3 className="text-sm font-bold text-white">Task Distribution</h3>
                  <p className="text-[10px] text-slate-400">Fog vs Cloud</p>
                </div>
                <div className="flex-1 min-h-0 relative">
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
                      <Pie data={allocationData} dataKey="value" cx="50%" cy="50%"
                        innerRadius={40} outerRadius={65} paddingAngle={3} stroke="none">
                        {allocationData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`url(${index === 0 ? '#fogGradient' : index === 1 ? '#cloudGradient' : '#hybridGradient'})`} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', backdropFilter: 'blur(8px)', fontSize: '12px' }}
                        itemStyle={{ color: '#fff', fontSize: '12px' }}
                      />
                      <text x="50%" y="50%" textAnchor="middle" className="fill-white text-xl font-bold" style={{ fontSize: '20px' }}>
                        {totalAllocations}
                      </text>
                      <text x="50%" y="60%" textAnchor="middle" className="fill-slate-400 text-[10px]" style={{ fontSize: '10px' }}>
                        Tasks
                      </text>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend */}
                <div className="mt-2 space-y-1">
                  {allocationData.map((item, index) => (
                    <div key={item.name} className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-emerald-500' : index === 1 ? 'bg-blue-500' : 'bg-amber-500'}`}></div>
                        <span className="text-slate-300 text-[10px]">{item.name}</span>
                      </div>
                      <div className="text-xs font-semibold text-white">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </WidgetWrapper>
          </div>
        )}

        {/* Edge Node Telemetry */}
        {!hiddenWidgets.includes("telemetry") && (
          <div key="telemetry">
            <WidgetWrapper id="telemetry" isEditMode={isEditMode} onRemove={removeWidget} title="Edge Telemetry" icon={HardDrive}>
              <div className="p-3 h-full flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <HardDrive size={18} className="text-indigo-400" />
                  <h3 className="text-sm font-bold text-white">Edge Node Telemetry</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-1 content-start">
                  {[
                    { title: "CPU Usage", value: `${data.system?.cpu || 0}%`, sub: "Fog node core utilization", icon: Cpu, color: "text-amber-400" },
                    { title: "Memory Usage", value: `${data.system?.memory || 0}%`, sub: "Fog node RAM allocation", icon: HardDrive, color: "text-cyan-400" },
                    { title: "Cloud Bytes", value: `${data.bandwidth?.cloud_bytes || 0} B`, sub: "Egress window volume", icon: Network, color: "text-indigo-400" },
                    { title: "Fog Bytes", value: `${data.bandwidth?.fog_bytes || 0} B`, sub: "Ingress window volume", icon: Activity, color: "text-emerald-400" },
                  ].map((m, i) => (
                    <div key={i} className="glass-card p-3 relative overflow-hidden group border border-slate-700/50 hover:shadow-md transition-all">
                      <div className={`absolute -right-3 -top-3 w-16 h-16 rounded-full opacity-5 group-hover:opacity-10 transition-opacity ${m.color.replace('text-', 'bg-')}`}></div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className={`p-1.5 rounded-md bg-gradient-to-br from-white/5 to-white/10 border border-white/10 ${m.color}`}>
                          <m.icon size={14} strokeWidth={2} />
                        </div>
                        <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{m.title}</h4>
                      </div>
                      <h2 className="text-xl font-bold text-white mb-0 tracking-tight">{m.value}</h2>
                      <p className="text-[9px] text-slate-500 flex items-center gap-0.5"><Clock size={8} />{m.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </WidgetWrapper>
          </div>
        )}
      </ResponsiveGridLayout>
    </div>
  );
}