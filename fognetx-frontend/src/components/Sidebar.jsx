import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Cpu,
  Activity,
  Wifi,
  Server,
  FileText,
  Zap
} from "lucide-react";

import logo from "../assets/logo.png";

export default function Sidebar() {
  return (
    <div className="sidebar">
      <div className="logo-section">
        <img src={logo} alt="FOGNET-X" className="logo" />
        <h2>FOGNET-X</h2>
        <span>Fog Intelligence Platform</span>
      </div>

      <nav>
        <NavLink to="/overview">
          <LayoutDashboard size={18} /> Overview
        </NavLink>

        <NavLink to="/live">
          <Zap size={18} /> Live Execution
        </NavLink>

        <NavLink to="/orchestration">
          <Cpu size={18} /> Orchestration
        </NavLink>

        <NavLink to="/latency">
          <Activity size={18} /> Latency
        </NavLink>

        <NavLink to="/network">
          <Wifi size={18} /> Network
        </NavLink>

        <NavLink to="/devices">
          <Server size={18} /> Devices
        </NavLink>

        <NavLink to="/logs">
          <FileText size={18} /> Logs
        </NavLink>
      </nav>
    </div>
  );
}