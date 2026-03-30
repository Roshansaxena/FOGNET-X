import { motion } from "framer-motion";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { Bell, Search, X } from "lucide-react";
import { useState } from "react";

export default function Layout() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications] = useState([
    { id: 1, title: "System Online", message: "FOGNET-X is running normally", time: "2 min ago", read: false },
    { id: 2, title: "New Device Connected", message: "Device DEV-001 registered", time: "5 min ago", read: false },
    { id: 3, title: "SLA Warning", message: "Cloud latency exceeded 200ms", time: "10 min ago", read: true },
  ]);

  const handleSearch = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      // Navigate to devices page with search
      navigate("/devices");
      // Store search in localStorage for devices page to pick up
      localStorage.setItem("globalSearch", searchQuery);
      setSearchQuery("");
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="app-container">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Area */}
      <div className="main-content">

        {/* TOPBAR */}
        <div className="topbar relative z-40">
          <div className="flex items-center gap-4">
            <h2 className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 font-bold text-xl">Dashboard</h2>
            <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-emerald-400 text-xs font-semibold tracking-wide uppercase">System Live</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative group hidden sm:block">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4 group-focus-within:text-indigo-400 transition-colors" />
               <input
                 className="bg-slate-900/50 border border-white/5 pl-10 pr-4 py-2 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 w-64 transition-all"
                 placeholder="Search devices... (Press Enter)"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 onKeyDown={handleSearch}
               />
            </div>
            
            {/* Notification Bell */}
            <div className="relative z-[9999]">
              <button 
                className="relative p-2 text-slate-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-xl"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                 <Bell size={20} />
                 {unreadCount > 0 && (
                   <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-slate-900 animate-pulse"></span>
                 )}
              </button>
              
              {/* Notification Dropdown */}
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-[9999] overflow-hidden"
                  style={{ position: 'absolute' }}
                >
                  <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                    <h3 className="text-white font-semibold">Notifications</h3>
                    <button 
                      onClick={() => setShowNotifications(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-slate-400 text-sm">No notifications</div>
                    ) : (
                      notifications.map((notif) => (
                        <div key={notif.id} className={`p-4 border-b border-slate-800 hover:bg-white/5 transition-colors ${!notif.read ? 'bg-indigo-500/5' : ''}`}>
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-white text-sm font-medium">{notif.title}</span>
                            {!notif.read && <span className="w-2 h-2 bg-indigo-500 rounded-full mt-1"></span>}
                          </div>
                          <p className="text-slate-400 text-xs mb-1">{notif.message}</p>
                          <span className="text-slate-500 text-xs">{notif.time}</span>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </div>

            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg cursor-pointer hover:scale-105 transition-transform">
               A
            </div>
          </div>
        </div>

        {/* PAGE CONTENT */}
        <motion.div
          className="page-content pb-10"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <Outlet />
        </motion.div>

      </div>
    </div>
  );
}
