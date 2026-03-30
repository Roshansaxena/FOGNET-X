import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Cpu,
  Activity,
  Wifi,
  Server,
  FileText,
  Zap,
  LogOut
} from "lucide-react";

import logo from "../assets/logo.png";

export default function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const navItemClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${
      isActive
        ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-400 border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]"
        : "text-slate-400 hover:bg-white/5 hover:text-white"
    }`;

  return (
    <div className="w-[280px] h-screen bg-slate-900/40 backdrop-blur-2xl border-r border-white/5 p-6 flex flex-col justify-between">
      <div>
        <div className="flex flex-col items-center mb-10 mt-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center p-2 mb-4 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
             <img src={logo} alt="FOGNET-X" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">FOGNET-X</h2>
          <span className="text-xs text-indigo-400 font-medium tracking-wide uppercase mt-1">Intelligence Platform</span>
        </div>

        <nav className="flex flex-col gap-2">
          <NavLink to="/overview" className={navItemClass}>
            <LayoutDashboard size={20} /> Overview
          </NavLink>

          <NavLink to="/live" className={navItemClass}>
             <Zap size={20} className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" /> Live Execution
          </NavLink>

          <NavLink to="/orchestration" className={navItemClass}>
            <Cpu size={20} /> Orchestration
          </NavLink>

          <NavLink to="/latency" className={navItemClass}>
            <Activity size={20} /> Latency
          </NavLink>

          <NavLink to="/network" className={navItemClass}>
            <Wifi size={20} /> Network
          </NavLink>

          <NavLink to="/devices" className={navItemClass}>
            <Server size={20} /> Devices
          </NavLink>

          <NavLink to="/logs" className={navItemClass}>
            <FileText size={20} /> Logs
          </NavLink>
        </nav>
      </div>

      <div className="mt-8">
        <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-white/5 mb-4">
           <h4 className="text-sm font-semibold text-white mb-1">System Health</h4>
           <div className="w-full bg-slate-800 rounded-full h-1.5 mb-2 mt-3">
             <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: '98%' }}></div>
           </div>
           <span className="text-xs text-slate-400">98% Optimization</span>
        </div>
        
        <button 
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl text-slate-300 hover:text-white hover:bg-red-500/10 hover:border-red-500/30 border border-transparent transition-all"
        >
          <LogOut size={18} /> Logout
        </button>
      </div>
    </div>
  );
}
