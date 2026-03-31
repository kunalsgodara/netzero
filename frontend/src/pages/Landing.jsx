import React, { useState } from "react";

import { useNavigate } from "react-router-dom";
import { Leaf, ArrowRight, BarChart3, ShieldCheck, Sparkles, FileText, Activity, Mail, Lock, User } from "lucide-react";

const db = globalThis.__B44_DB__

const API_BASE = import.meta.env.VITE_API_URL || "";

export default function Landing() {
  const navigate = useNavigate();
  const [showAuth, setShowAuth] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", full_name: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("access_token");
  if (token) {
    // Already logged in — show a "Go to Dashboard" landing
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";
      const body = isRegister
        ? { email: form.email, password: form.password, full_name: form.full_name }
        : { email: form.email, password: form.password };
      const resp = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.detail || "Authentication failed");
      }
      const data = await resp.json();
      localStorage.setItem("access_token", data.access_token);
      if (data.refresh_token) localStorage.setItem("refresh_token", data.refresh_token);
      window.location.href = "/Dashboard";
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE}/api/auth/google?redirect=${encodeURIComponent(window.location.origin + "/Dashboard")}`;
  };

  const features = [
    { icon: Activity, title: "Emissions Tracking", desc: "Track Scope 1, 2 & 3 emissions with full GHG Protocol compliance" },
    { icon: ShieldCheck, title: "CBAM Compliance", desc: "Manage Carbon Border Adjustment Mechanism declarations" },
    { icon: Sparkles, title: "AI Insights", desc: "Get AI-powered recommendations to reduce your carbon footprint" },
    { icon: FileText, title: "Reports", desc: "Generate SECR reports and CBAM declarations" },
    { icon: BarChart3, title: "Benchmarking", desc: "Compare your performance against industry peers" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 lg:px-12 py-4 border-b border-green-100/50 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Leaf className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">NetZeroWorks</h1>
            <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Carbon Platform</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {token ? (
            <button
              onClick={() => navigate("/Dashboard")}
              className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Go to Dashboard <ArrowRight className="w-4 h-4 inline ml-1" />
            </button>
          ) : (
            <>
              <button
                onClick={() => { setShowAuth(true); setIsRegister(false); }}
                className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => { setShowAuth(true); setIsRegister(true); }}
                className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Get Started
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6">
          <Leaf className="w-3.5 h-3.5" />
          Carbon Compliance Made Simple
        </div>
        <h2 className="text-4xl lg:text-5xl font-extrabold text-foreground leading-tight">
          Track, Report & Reduce<br />
          <span className="text-primary">Your Carbon Footprint</span>
        </h2>
        <p className="text-lg text-muted-foreground mt-6 max-w-2xl mx-auto">
          NetZeroWorks helps organizations manage their emissions data, comply with CBAM regulations, and plan their journey to net zero — powered by AI.
        </p>
        {!token && (
          <div className="flex gap-3 justify-center mt-8">
            <button
              onClick={() => { setShowAuth(true); setIsRegister(true); }}
              className="px-8 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/25"
            >
              Start Free <ArrowRight className="w-4 h-4 inline ml-1" />
            </button>
            <button
              onClick={() => { setShowAuth(true); setIsRegister(false); }}
              className="px-8 py-3 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
            >
              Sign In
            </button>
          </div>
        )}
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div key={f.title} className="bg-white/80 backdrop-blur border border-green-100 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <f.icon className="w-8 h-8 text-primary mb-3" />
              <h3 className="font-bold text-foreground text-sm">{f.title}</h3>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Auth Modal */}
      {showAuth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setShowAuth(false)} />
          <div className="relative bg-card rounded-2xl shadow-2xl p-8 w-full max-w-sm z-50 border border-border">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Leaf className="w-4 h-4 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-bold text-foreground">{isRegister ? "Create Account" : "Welcome Back"}</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Full Name</label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                      className="w-full pl-10 pr-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="John Doe"
                    />
                  </div>
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-muted-foreground">Email</label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full pl-10 pr-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="you@company.com"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Password</label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full pl-10 pr-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {error && <p className="text-xs text-destructive">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {loading ? "Please wait..." : (isRegister ? "Create Account" : "Sign In")}
              </button>
            </form>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
              <div className="relative flex justify-center"><span className="bg-card px-3 text-xs text-muted-foreground">or</span></div>
            </div>

            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-2 py-2.5 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Continue with Google
            </button>

            <p className="text-xs text-center text-muted-foreground mt-4">
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
