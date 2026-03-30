import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, Cpu, Cloud, Zap, Shield, Activity, Server, Wifi, Database,
  ChevronDown, Play, Github, Linkedin, Menu, X, AlertTriangle,
  TrendingUp, Layers, Clock, Globe, ChevronRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/fognetx-logo.svg";

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Problem", href: "#problem" },
    { name: "Solution", href: "#solution" },
    { name: "Approach", href: "#approach" },
    { name: "Features", href: "#features" },
  ];

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-slate-950/90 backdrop-blur-xl border-b border-white/5" : "bg-transparent"
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <motion.div 
            className="flex items-center gap-3 cursor-pointer"
            whileHover={{ scale: 1.02 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <img src={logo} alt="FOGNET-X" className="w-8 h-8 lg:w-10 lg:h-10" />
            <span className="text-xl lg:text-2xl font-bold text-white tracking-tight">FOGNET-X</span>
          </motion.div>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a key={link.name} href={link.href} className="text-sm text-slate-400 hover:text-white transition-colors font-medium">
                {link.name}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <button onClick={() => navigate("/login")} className="text-sm text-slate-300 hover:text-white transition-colors font-medium">
              Sign In
            </button>
            <button onClick={() => navigate("/login")} className="px-4 py-2 bg-white text-slate-950 rounded-lg text-sm font-semibold hover:bg-slate-200 transition-colors">
              Get Started
            </button>
          </div>

          <button className="md:hidden p-2 text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="md:hidden bg-slate-950/95 backdrop-blur-xl border-b border-white/5">
            <div className="px-6 py-4 space-y-4">
              {navLinks.map((link) => (
                <a key={link.name} href={link.href} className="block text-slate-300 hover:text-white transition-colors font-medium" onClick={() => setMobileMenuOpen(false)}>
                  {link.name}
                </a>
              ))}
              <button onClick={() => navigate("/login")} className="w-full px-4 py-2 bg-white text-slate-950 rounded-lg text-sm font-semibold">Get Started</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

function Hero() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%234f46e5%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-20" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-32 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-8">
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse" />
            <span className="text-sm text-indigo-300 font-medium">Now with Multi-Sensor Support</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white tracking-tight mb-6">
            <span className="block">Fog-Cloud</span>
            <span className="block bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Intelligence
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed">
            Context-aware orchestration for Industrial IoT. 
            Real-time decision making at the edge with intelligent cloud offloading.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={() => navigate("/login")} className="group px-8 py-4 bg-white text-slate-950 rounded-xl font-semibold text-lg hover:bg-slate-200 transition-all flex items-center gap-2">
              Launch Demo
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <a href="#problem" className="px-8 py-4 border border-white/20 text-white rounded-xl font-semibold text-lg hover:bg-white/5 transition-all flex items-center gap-2">
              <Play className="w-5 h-5" />
              Learn More
            </a>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 1 }} className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <a href="#problem" className="flex flex-col items-center gap-2 text-slate-500 hover:text-white transition-colors">
            <span className="text-xs uppercase tracking-widest">Scroll</span>
            <ChevronDown className="w-5 h-5 animate-bounce" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}

function Problem() {
  const problems = [
    { icon: Clock, title: "High Latency", desc: "Cloud-only processing causes 100-500ms delays, unacceptable for critical industrial applications" },
    { icon: Wifi, title: "Network Dependency", desc: "Poor connectivity disrupts operations in remote factory locations" },
    { icon: Database, title: "Data Overload", desc: "Massive sensor data floods cloud infrastructure, causing bottlenecks" },
    { icon: AlertTriangle, title: "Slow Response", desc: "Emergency situations require sub-100ms response times that cloud can't guarantee" },
  ];

  return (
    <section id="problem" className="py-24 lg:py-32 bg-slate-950 relative">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 mb-6">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span className="text-sm text-rose-300 font-medium">The Challenge</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Traditional IoT Can't Handle Critical Industrial Demands
            </h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              Manufacturing facilities, chemical plants, and smart factories generate massive amounts of sensor data. 
              Sending everything to the cloud creates dangerous delays when seconds matter for safety and efficiency.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-4">
            {problems.map((problem, idx) => (
              <motion.div
                key={problem.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-rose-500/30 transition-colors"
              >
                <problem.icon className="w-10 h-10 text-rose-400 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">{problem.title}</h3>
                <p className="text-sm text-slate-400">{problem.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Solution() {
  const features = [
    { icon: Zap, title: "Sub-50ms Response", desc: "Edge processing delivers real-time decisions" },
    { icon: Shield, title: "Context-Aware", desc: "Battery & network-aware intelligent routing" },
    { icon: Layers, title: "Hybrid Execution", desc: "Fog + Cloud working together seamlessly" },
    { icon: TrendingUp, title: "SLA Compliance", desc: "99.9% uptime with automatic failover" },
  ];

  return (
    <section id="solution" className="py-24 lg:py-32 bg-slate-900/50 relative">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-300 font-medium">The Solution</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Intelligent Edge-Cloud Orchestration
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              FOGNET-X dynamically decides where to process each event based on risk, latency requirements, 
              device health, and network conditions.
            </p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className="p-6 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/10 hover:border-emerald-500/30 transition-all hover:scale-105"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-slate-400">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Approach() {
  const steps = [
    { num: "01", title: "Data Ingestion", desc: "Sensors stream data via MQTT to the Fog node" },
    { num: "02", title: "Risk Assessment", desc: "Multi-sensor fusion calculates threat level" },
    { num: "03", title: "Context Analysis", desc: "Device health & network quality evaluated" },
    { num: "04", title: "Smart Routing", desc: "Decision engine routes to Fog or Cloud" },
    { num: "05", title: "Actuator Response", desc: "Critical alerts trigger immediate action" },
  ];

  return (
    <section id="approach" className="py-24 lg:py-32 bg-slate-950 relative">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6">
              <Server className="w-4 h-4 text-indigo-400" />
              <span className="text-sm text-indigo-300 font-medium">How It Works</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">Our Approach</h2>
          </motion.div>
        </div>

        <div className="space-y-6">
          {steps.map((step, idx) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, x: idx % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className="flex items-center gap-6 p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-indigo-500/30 transition-colors"
            >
              <span className="text-4xl font-bold text-indigo-400/50">{step.num}</span>
              <div>
                <h3 className="text-xl font-semibold text-white mb-1">{step.title}</h3>
                <p className="text-slate-400">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const capabilities = [
    { icon: Activity, title: "15+ Sensor Types", desc: "Temperature, Gas, Humidity, Pressure, Motion, Vibration & more" },
    { icon: Cloud, title: "3-Tier Architecture", desc: "IoT → Fog → Cloud with intelligent load balancing" },
    { icon: Globe, title: "Real-time Dashboard", desc: "Live monitoring with WebSocket updates" },
    { icon: Database, title: "SQLite + Cloud", desc: "Local storage with cloud synchronization" },
  ];

  return (
    <section id="features" className="py-24 lg:py-32 bg-slate-900/50 relative">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">Key Features</h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Built for industrial environments with enterprise-grade reliability
            </p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {capabilities.map((cap, idx) => (
            <motion.div
              key={cap.title}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className="p-8 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 hover:border-indigo-500/40 transition-all"
            >
              <cap.icon className="w-12 h-12 text-indigo-400 mb-4" />
              <h3 className="text-2xl font-semibold text-white mb-2">{cap.title}</h3>
              <p className="text-slate-400">{cap.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  const navigate = useNavigate();

  return (
    <section className="py-24 lg:py-32 bg-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/20" />
      <div className="relative max-w-4xl mx-auto px-6 lg:px-8 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <h2 className="text-4xl lg:text-6xl font-bold text-white mb-6">Ready to Deploy?</h2>
          <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
            Experience the future of industrial IoT orchestration. Launch the demo and see FOGNET-X in action.
          </p>
          <button onClick={() => navigate("/login")} className="group inline-flex items-center gap-3 px-8 py-4 bg-white text-slate-950 rounded-xl font-semibold text-lg hover:bg-slate-200 transition-all">
            Launch Live Demo
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-12 bg-slate-950 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <img src={logo} alt="FOGNET-X" className="w-8 h-8" />
            <span className="text-lg font-bold text-white">FOGNET-X</span>
          </div>
          <p className="text-slate-500 text-sm">© 2026 FOGNET-X. Built for Industrial IoT.</p>
          <div className="flex items-center gap-4">
            <a href="https://github.com/Roshansaxena/FOGNET-X" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors"><Github className="w-5 h-5" /></a>
            <a href="https://www.linkedin.com/in/roshansaxena/" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors"><Linkedin className="w-5 h-5" /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function Landing() {
  return (
    <div className="bg-slate-950 min-h-screen">
      <Navbar />
      <Hero />
      <Problem />
      <Solution />
      <Approach />
      <Features />
      <CTA />
      <Footer />
    </div>
  );
}
