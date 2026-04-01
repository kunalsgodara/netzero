import { useState, useEffect, useRef, useCallback } from "react";

import { useNavigate } from "react-router-dom";
import { Leaf, ArrowRight, BarChart3, ShieldCheck, Sparkles, FileText, Activity, Mail, Lock, User, TrendingDown, Globe } from "lucide-react";
import { useToast, ToastContainer } from "@/components/ui/Toast";

const API_BASE = import.meta.env.VITE_API_URL || "";

/* ── 3-D tilt card ─────────────────────────────────────────────── */
function TiltCard({ children, className }) {
  const ref = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0, hover: false });

  const onMouseMove = useCallback((e) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const x = ((e.clientX - r.left) / r.width - 0.5) * 16;
    const y = ((e.clientY - r.top) / r.height - 0.5) * -16;
    setTilt({ x, y, hover: true });
  }, []);

  const onMouseLeave = useCallback(() => setTilt({ x: 0, y: 0, hover: false }), []);

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className={className}
      style={{
        transform: `perspective(700px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg) scale(${tilt.hover ? 1.03 : 1})`,
        transition: tilt.hover ? "transform 0.08s linear" : "transform 0.5s ease",
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
}

/* ── Animated counter ──────────────────────────────────────────── */
function Counter({ to, suffix = "", prefix = "" }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const done = useRef(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !done.current) {
        done.current = true;
        const start = performance.now();
        const dur = 1800;
        const tick = (now) => {
          const p = Math.min((now - start) / dur, 1);
          setVal(Math.floor((1 - Math.pow(1 - p, 3)) * to));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.4 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to]);

  return <span ref={ref}>{prefix}{val.toLocaleString()}{suffix}</span>;
}

/* ── Floating orb (pure CSS animation via inline style) ────────── */
function Orb({ className, style }) {
  return <div className={`absolute rounded-full blur-3xl opacity-30 pointer-events-none ${className}`} style={style} />;
}

export default function Landing() {
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", full_name: "" });
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const { toasts, toast, removeToast } = useToast();

  const token = localStorage.getItem("access_token");

  /* Parallax mouse tracking */
  useEffect(() => {
    const h = (e) => setMouse({ x: e.clientX / window.innerWidth - 0.5, y: e.clientY / window.innerHeight - 0.5 });
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (isRegister && !form.full_name.trim()) errs.full_name = true;
    if (!form.email.trim()) errs.email = true;
    if (!form.password) errs.password = true;
    else if (isRegister && form.password.length < 8) {
      errs.password = true;
      toast("Password must be at least 8 characters", "error");
      setFieldErrors(errs);
      return;
    }
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      toast("Please fill in all required fields", "error");
      return;
    }
    setFieldErrors({});
    setLoading(true);
    try {
      const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
      const body = isRegister
        ? { email: form.email, password: form.password, full_name: form.full_name }
        : { email: form.email, password: form.password };
      const resp = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (!resp.ok) { const d = await resp.json().catch(() => ({})); throw new Error(d.detail || "Authentication failed"); }
      const data = await resp.json();
      localStorage.setItem("access_token", data.access_token);
      if (data.refresh_token) localStorage.setItem("refresh_token", data.refresh_token);
      toast(isRegister ? "Account created! Welcome aboard." : "Welcome back!", "success");
      setTimeout(() => { window.location.href = "/Dashboard"; }, 800);
    } catch (err) { toast(err.message, "error"); }
    finally { setLoading(false); }
  };

  const clearFieldError = (f) => setFieldErrors(p => ({ ...p, [f]: false }));
  const handleGoogleLogin = () => { window.location.href = `${API_BASE}/api/auth/google?redirect=${encodeURIComponent(window.location.origin + "/Dashboard")}`; };

  const features = [
    { icon: Activity,   title: "Emissions Tracking", desc: "Track Scope 1, 2 & 3 with full GHG Protocol compliance", color: "from-green-400 to-emerald-600" },
    { icon: ShieldCheck,title: "CBAM Compliance",    desc: "Manage Carbon Border Adjustment Mechanism declarations", color: "from-blue-400 to-cyan-600" },
    { icon: Sparkles,   title: "AI Insights",        desc: "AI-powered recommendations to cut your carbon footprint", color: "from-purple-400 to-violet-600" },
    { icon: FileText,   title: "Reports",            desc: "Generate SECR reports and CBAM declarations instantly", color: "from-amber-400 to-orange-500" },
    { icon: BarChart3,  title: "Benchmarking",       desc: "Compare your performance against industry peers", color: "from-pink-400 to-rose-500" },
    { icon: TrendingDown,title:"Scenario Planner",   desc: "Model reduction pathways and net-zero roadmaps", color: "from-teal-400 to-green-600" },
  ];

  const stats = [
    { label: "Companies Tracking", to: 500, suffix: "+" },
    { label: "tCO₂e Monitored",    to: 2400000, suffix: "+" },
    { label: "CBAM Declarations",  to: 12000, suffix: "+" },
    { label: "AI Recommendations", to: 98000, suffix: "+" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f0a] text-white overflow-x-hidden">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* ── Animated background orbs ─────────────────────────────── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <Orb className="w-[600px] h-[600px] bg-green-500" style={{ top: "-10%", left: "-10%", animation: "orbFloat1 12s ease-in-out infinite" }} />
        <Orb className="w-[500px] h-[500px] bg-emerald-400" style={{ bottom: "0%", right: "-5%", animation: "orbFloat2 15s ease-in-out infinite" }} />
        <Orb className="w-[400px] h-[400px] bg-teal-500" style={{ top: "40%", left: "40%", animation: "orbFloat3 10s ease-in-out infinite" }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_#0a0f0a_80%)]" />
        {/* Grid lines */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: "linear-gradient(hsl(142 64% 34%) 1px, transparent 1px), linear-gradient(90deg, hsl(142 64% 34%) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />
      </div>

      {/* ── Navbar ──────────────────────────────────────────────── */}
      <nav className="relative z-20 flex items-center justify-between px-6 lg:px-16 py-5 border-b border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/40">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight">NetZeroWorks</h1>
            <p className="text-[9px] text-white/40 uppercase tracking-widest">Carbon Platform</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {token ? (
            <button onClick={() => navigate("/Dashboard")} className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/30">
              Dashboard <ArrowRight className="w-4 h-4 inline ml-1" />
            </button>
          ) : (
            <>
              <button onClick={() => { setShowAuth(true); setIsRegister(false); }} className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all">Sign In</button>
              <button onClick={() => { setShowAuth(true); setIsRegister(true); }} className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/30">Get Started</button>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-semibold mb-8 animate-pulse">
          <Globe className="w-3.5 h-3.5" />
          Carbon Compliance Made Simple
        </div>

        {/* Headline with parallax */}
        <div style={{ transform: `translate(${mouse.x * -12}px, ${mouse.y * -8}px)`, transition: "transform 0.3s ease-out" }}>
          <h2 className="text-5xl lg:text-7xl font-black leading-tight tracking-tight mb-6">
            Track, Report<br />
            <span className="bg-gradient-to-r from-green-400 via-emerald-300 to-teal-400 bg-clip-text text-transparent">
              & Reduce
            </span>
          </h2>
          <p className="text-lg text-white/50 max-w-2xl mx-auto leading-relaxed">
            NetZeroWorks helps organizations manage emissions, comply with CBAM, and plan their journey to net zero — powered by AI.
          </p>
        </div>

        {/* CTA buttons */}
        {!token && (
          <div className="flex gap-4 justify-center mt-10">
            <button
              onClick={() => { setShowAuth(true); setIsRegister(true); }}
              className="relative group px-8 py-3.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shadow-2xl shadow-primary/40 overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">Start Free <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></span>
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <button
              onClick={() => { setShowAuth(true); setIsRegister(false); }}
              className="px-8 py-3.5 border border-white/20 rounded-xl text-sm font-semibold text-white/80 hover:bg-white/10 hover:border-white/40 transition-all backdrop-blur-sm"
            >
              Sign In
            </button>
          </div>
        )}

        {/* Floating 3D dashboard preview */}
        <div
          className="relative mt-20 mx-auto max-w-3xl"
          style={{ transform: `translate(${mouse.x * 20}px, ${mouse.y * 10}px)`, transition: "transform 0.4s ease-out" }}
        >
          <div className="absolute inset-0 bg-primary/20 rounded-3xl blur-3xl scale-95" />
          <div className="relative bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-2xl" style={{ transform: "perspective(1200px) rotateX(6deg)", transformOrigin: "center bottom" }}>
            {/* Mock dashboard */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[["Total Emissions", "0.3 tCO₂e", "text-green-400"], ["Scope 1", "0.3 tCO₂e", "text-red-400"], ["Scope 2", "0.0 tCO₂e", "text-amber-400"], ["CBAM Liability", "€73,628", "text-blue-400"]].map(([label, val, color]) => (
                <div key={label} className="bg-white/5 rounded-xl p-3 border border-white/5">
                  <p className="text-[9px] text-white/40 uppercase tracking-wider">{label}</p>
                  <p className={`text-base font-bold mt-1 ${color}`}>{val}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 bg-white/5 rounded-xl p-3 border border-white/5 h-24 flex items-end">
                <div className="w-full flex items-end gap-1">
                  {[30, 45, 28, 60, 35, 55, 42, 70, 38, 52, 65, 48].map((h, i) => (
                    <div key={i} className="flex-1 bg-gradient-to-t from-primary to-emerald-400 rounded-sm opacity-80" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/5 h-24 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full border-4 border-primary/30 border-t-primary animate-spin" style={{ animationDuration: "3s" }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────────────── */}
      <section className="relative z-10 border-y border-white/5 bg-white/[0.02] py-12">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <p className="text-3xl font-black text-primary">
                <Counter to={s.to} suffix={s.suffix} />
              </p>
              <p className="text-xs text-white/40 mt-1 uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature cards with 3-D tilt ──────────────────────────── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <h3 className="text-3xl font-extrabold">Everything you need for<br /><span className="text-primary">carbon compliance</span></h3>
          <p className="text-white/40 text-sm mt-3">One platform — from data collection to regulatory reporting</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <TiltCard
              key={f.title}
              className="relative bg-white/5 border border-white/10 rounded-2xl p-6 cursor-default overflow-hidden group"
            >
              {/* Gradient glow on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${f.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl`} />
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg`}>
                <f.icon className="w-5 h-5 text-white" />
              </div>
              <h4 className="font-bold text-sm text-white">{f.title}</h4>
              <p className="text-xs text-white/50 mt-2 leading-relaxed">{f.desc}</p>
              <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-primary group-hover:translate-x-1 transition-all mt-4" />
            </TiltCard>
          ))}
        </div>
      </section>

      {/* ── Footer CTA ───────────────────────────────────────────── */}
      {!token && (
        <section className="relative z-10 text-center py-24 px-6">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[600px] h-[200px] bg-primary/10 rounded-full blur-3xl" />
          </div>
          <h3 className="text-4xl font-black mb-4 relative">Ready to reach <span className="text-primary">net zero?</span></h3>
          <p className="text-white/40 text-sm mb-8 relative">Join hundreds of companies already tracking with NetZeroWorks</p>
          <button
            onClick={() => { setShowAuth(true); setIsRegister(true); }}
            className="relative group inline-flex items-center gap-2 px-10 py-4 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary/90 shadow-2xl shadow-primary/40 transition-all"
          >
            Start for Free <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </section>
      )}

      {/* ── CSS keyframes ─────────────────────────────────────────── */}
      <style>{`
        @keyframes orbFloat1 {
          0%,100% { transform: translate(0,0) scale(1); }
          33%      { transform: translate(60px,-40px) scale(1.1); }
          66%      { transform: translate(-30px,50px) scale(0.95); }
        }
        @keyframes orbFloat2 {
          0%,100% { transform: translate(0,0) scale(1); }
          40%      { transform: translate(-80px,30px) scale(1.15); }
          70%      { transform: translate(40px,-60px) scale(0.9); }
        }
        @keyframes orbFloat3 {
          0%,100% { transform: translate(0,0) scale(1); }
          50%      { transform: translate(-50px,-50px) scale(1.2); }
        }
      `}</style>

      {/* ── Auth Modal ───────────────────────────────────────────── */}
      {showAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowAuth(false)} />
          <div className="relative bg-[#111714] border border-white/10 rounded-2xl shadow-2xl p-8 w-full max-w-sm z-50">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Leaf className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-bold">{isRegister ? "Create Account" : "Welcome Back"}</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <div>
                  <label className="text-xs font-medium text-white/50">Full Name</label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input type="text" value={form.full_name}
                      onChange={(e) => { setForm({ ...form, full_name: e.target.value }); clearFieldError("full_name"); }}
                      className={`w-full pl-10 pr-3 py-2.5 rounded-lg text-sm bg-white/5 text-white outline-none focus:ring-2 focus:ring-primary/40 border ${fieldErrors.full_name ? "border-red-500" : "border-white/10"}`}
                      placeholder="John Doe" />
                  </div>
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-white/50">Email</label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input type="email" value={form.email}
                    onChange={(e) => { setForm({ ...form, email: e.target.value }); clearFieldError("email"); }}
                    className={`w-full pl-10 pr-3 py-2.5 rounded-lg text-sm bg-white/5 text-white outline-none focus:ring-2 focus:ring-primary/40 border ${fieldErrors.email ? "border-red-500" : "border-white/10"}`}
                    placeholder="you@company.com" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-white/50">Password {isRegister && <span className="text-white/30">(min 8 chars)</span>}</label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input type="password" value={form.password}
                    onChange={(e) => { setForm({ ...form, password: e.target.value }); clearFieldError("password"); }}
                    className={`w-full pl-10 pr-3 py-2.5 rounded-lg text-sm bg-white/5 text-white outline-none focus:ring-2 focus:ring-primary/40 border ${fieldErrors.password ? "border-red-500" : "border-white/10"}`}
                    placeholder="••••••••" />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 shadow-lg shadow-primary/30">
                {loading ? "Please wait..." : (isRegister ? "Create Account" : "Sign In")}
              </button>
            </form>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
              <div className="relative flex justify-center"><span className="bg-[#111714] px-3 text-xs text-white/30">or</span></div>
            </div>

            <button onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-2 py-2.5 border border-white/10 rounded-lg text-sm font-medium text-white/70 hover:bg-white/5 transition-all">
              <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Continue with Google
            </button>

            <p className="text-xs text-center text-white/30 mt-4">
              {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
              <button onClick={() => setIsRegister(!isRegister)} className="text-primary font-semibold hover:underline">
                {isRegister ? "Sign In" : "Sign Up"}
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
