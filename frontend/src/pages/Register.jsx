import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Lock, ArrowRight, CheckCircle, Cpu, Wifi, Database } from "lucide-react";
import logo from "../assets/fognetx-logo.svg";

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.msg || "Registration failed");
        setIsLoading(false);
        return;
      }

      alert("Account created successfully! You can now log in.");
      navigate("/login");
    } catch (err) {
      alert("Network error.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* LEFT SIDE - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-slate-950">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <img src={logo} alt="FOGNET-X" className="w-10 h-10" />
            <span className="text-xl font-bold text-white">FOGNET-X</span>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Create Your Account</h1>
            <p className="text-slate-400">Join the <span className="text-indigo-400 font-semibold">FOGNET-X</span> orchestration network</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="Choose Username"
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
                placeholder="Choose Password"
                className="w-full pl-12 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none transition-colors"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex items-start gap-2 text-sm text-slate-400">
              <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-400 flex-shrink-0" />
              <span>By signing up, you agree to our Terms of Service and Privacy Policy</span>
            </div>

            <button 
              type="submit" 
              className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? "Creating account..." : (
                <>Create Account <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-slate-500 text-sm">Already have an account? </span>
            <button
              className="text-indigo-400 hover:text-indigo-300 font-semibold text-sm transition-colors"
              onClick={() => navigate("/login")}
            >
              Sign in
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - Dark with features */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-bl from-slate-900 via-slate-950 to-indigo-950 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-indigo-500/5 to-transparent" />
        
        {/* Top - Logo */}
        <div className="relative z-10 flex justify-end">
          <div className="flex items-center gap-3">
            <img src={logo} alt="FOGNET-X" className="w-10 h-10" />
            <span className="text-xl font-bold text-white">FOGNET-X</span>
          </div>
        </div>

        {/* Middle - Features */}
        <div className="relative z-10 flex-1 flex items-center">
          <div className="space-y-6 w-full">
            <h2 className="text-3xl font-bold text-white mb-8">Why FOGNET-X?</h2>
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <Cpu className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Edge Intelligence</h3>
                <p className="text-slate-400 text-sm">Process data at the edge with sub-50ms latency</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Wifi className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Smart Routing</h3>
                <p className="text-slate-400 text-sm">Automatic fog-cloud decision making</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <Database className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Multi-Sensor Support</h3>
                <p className="text-slate-400 text-sm">15+ sensor types for industrial IoT</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom - Stats */}
        <div className="relative z-10">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">99.9%</div>
              <div className="text-xs text-slate-400">Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">50ms</div>
              <div className="text-xs text-slate-400">Latency</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">24/7</div>
              <div className="text-xs text-slate-400">Monitoring</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
