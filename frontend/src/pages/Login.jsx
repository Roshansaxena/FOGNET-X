import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, ArrowRight, Server, Cloud, Shield } from "lucide-react";
import logo from "../assets/fognetx-logo.svg";

export default function Login({ setToken }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.msg || "Login failed");
        setIsLoading(false);
        return;
      }

      localStorage.setItem("token", data.access_token);
      setToken(data.access_token);
      navigate("/overview");
    } catch (err) {
      alert("Network error.");
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* LEFT SIDE - Dark with illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-indigo-500/5 to-transparent" />
        
        {/* Top - Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <img src={logo} alt="FOGNET-X" className="w-10 h-10" />
            <span className="text-xl font-bold text-white">FOGNET-X</span>
          </div>
        </div>

        {/* Middle - Dashboard Preview */}
        <div className="relative z-10 flex-1 flex items-center justify-center">
          <div className="relative">
            {/* Main dashboard card */}
            <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 shadow-2xl w-80">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-xs text-slate-400">System Live</span>
                </div>
                <span className="text-xs text-slate-500">98% Uptime</span>
              </div>
              
              {/* Mock chart bars */}
              <div className="flex items-end gap-1 h-24 mb-4">
                {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 50, 95].map((h, i) => (
                  <div key={i} className="flex-1 bg-indigo-500/60 rounded-t" style={{ height: `${h}%` }} />
                ))}
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-700/50 rounded-lg p-2 text-center">
                  <div className="text-lg font-bold text-white">24</div>
                  <div className="text-[10px] text-slate-400">Devices</div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-2 text-center">
                  <div className="text-lg font-bold text-emerald-400">99%</div>
                  <div className="text-[10px] text-slate-400">SLA</div>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-2 text-center">
                  <div className="text-lg font-bold text-blue-400">45ms</div>
                  <div className="text-[10px] text-slate-400">Latency</div>
                </div>
              </div>
            </div>
            
            {/* Floating cards */}
            <div className="absolute -top-4 -right-4 bg-slate-800/90 backdrop-blur rounded-xl p-3 border border-slate-700/50 shadow-xl">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Server className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Fog Node</div>
                  <div className="text-[10px] text-emerald-400">Online</div>
                </div>
              </div>
            </div>
            
            <div className="absolute -bottom-4 -left-4 bg-slate-800/90 backdrop-blur rounded-xl p-3 border border-slate-700/50 shadow-xl">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Cloud className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">Cloud</div>
                  <div className="text-[10px] text-blue-400">Connected</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom - Tagline */}
        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-white mb-2">Industrial IoT</h2>
          <p className="text-slate-400">Fog-Cloud Orchestration Platform for smart manufacturing</p>
        </div>
      </div>

      {/* RIGHT SIDE - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-slate-950">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <img src={logo} alt="FOGNET-X" className="w-10 h-10" />
            <span className="text-xl font-bold text-white">FOGNET-X</span>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Welcome back!</h1>
            <p className="text-slate-400">Please sign in to your <span className="text-indigo-400 font-semibold">FOGNET-X</span> account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="Username or Email"
                className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none transition-colors"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="password"
                placeholder="Password"
                className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none transition-colors"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                <input type="checkbox" className="rounded border-slate-700 bg-slate-800 text-indigo-500" />
                Remember me
              </label>
              <button type="button" className="text-indigo-400 hover:text-indigo-300">Forgot password?</button>
            </div>

            <button 
              type="submit" 
              className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : (
                <>Sign In <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-slate-500 text-sm">Don't have an account? </span>
            <button
              className="text-indigo-400 hover:text-indigo-300 font-semibold text-sm transition-colors"
              onClick={() => navigate("/register")}
            >
              Sign up
            </button>
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 text-slate-500">
            <Shield className="w-5 h-5" />
            <span className="text-xs">Secure SSL Encryption</span>
          </div>
        </div>
      </div>
    </div>
  );
}
