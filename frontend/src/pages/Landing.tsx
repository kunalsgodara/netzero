import { useState, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowRight, ShieldCheck, ChevronRight,
  Clock, AlertTriangle, Users, CheckCircle2,
} from "lucide-react"
import CompanyLogo from "@/components/ui/CompanyLogo"
import { useToast } from "@/hooks/useToast"

import { useMouseParallax } from "@/hooks/useMouseParallax"
import AuthModal from "@/components/auth/AuthModal"
import LABELS from "@/utils/labels"
import { FEATURES, STEPS, CBAM_PHASES, BAR_HEIGHTS } from "@/constants/landingData"


const G = "linear-gradient(135deg, #059669, #0d9488)"
const SHADOW = "0 8px 32px rgba(5,150,105,0.28), 0 2px 8px rgba(0,0,0,0.06)"
const GRAD_TEXT = {
  background: "linear-gradient(135deg, #059669, #0d9488)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
}



function TiltCard({ children, className, style }: any) {
  const ref = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0, hover: false })

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    setTilt({
      x: ((e.clientX - r.left) / r.width - 0.5) * 12,
      y: ((e.clientY - r.top) / r.height - 0.5) * -12,
      hover: true,
    })
  }, [])

  const onMouseLeave = useCallback(() => setTilt({ x: 0, y: 0, hover: false }), [])

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className={className}
      style={{
        transform: `perspective(900px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg) translateY(${tilt.hover ? -4 : 0}px)`,
        transition: tilt.hover ? "transform 0.08s linear" : "transform 0.5s ease",
        willChange: "transform",
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function StepConnector() {
  return (
    <div className="hidden lg:flex items-center justify-center w-14 flex-shrink-0">
      <div className="flex items-center gap-1">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-emerald-300"
            style={{ animation: `simplePulse 1.5s ${i * 0.3}s ease-in-out infinite` }}
          />
        ))}
      </div>
    </div>
  )
}



function HeroSection({ mouse, token, openRegister, openSignIn }: any) {
  return (
    <section className="relative z-10 bg-background w-full px-6 pt-24 pb-8 lg:pt-28 lg:pb-10 overflow-x-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-6 items-center">

          
          <div style={{ transform: `translate(${mouse.x * -8}px, ${mouse.y * -5}px)`, transition: "transform 0.45s ease-out" }}>
            <h2 className="text-5xl lg:text-[4.5rem] font-black leading-[1.04] tracking-tight mb-6 text-foreground">
              Carbon<br />Management<br />
              <span className="relative inline-block">
                <span style={GRAD_TEXT}>Made Effortless</span>
                <svg className="absolute -bottom-2 left-0 w-full" height="5" viewBox="0 0 300 5" preserveAspectRatio="none">
                  <path d="M0,4 Q75,0 150,3.5 Q225,7 300,2" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </span>
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed mb-9 max-w-md">
              Track Scope 1–3 emissions, calculate CBAM liability per installation, manage
              supplier data and certificates — all from one intelligent platform built for EU compliance teams.
            </p>
            {!token && (
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={openRegister}
                  className="group px-7 py-3.5 text-white rounded-xl text-sm font-bold transition-all hover:scale-[1.03] relative overflow-hidden"
                  style={{ background: G, boxShadow: SHADOW }}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {LABELS.BTN_GET_STARTED} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </button>
                <button
                  onClick={openSignIn}
                  className="px-7 py-3.5 rounded-xl text-sm font-bold text-muted-foreground transition-all hover:bg-muted hover:text-foreground border border-border"
                >
                  {LABELS.BTN_SIGN_IN}
                </button>
              </div>
            )}
          </div>

          
          <DashboardCard mouse={mouse} />
        </div>
      </div>
    </section>
  )
}

function DashboardCard({ mouse }: any) {
  return (
    <div className="relative flex items-center justify-center min-h-[480px] select-none" style={{ perspective: "1600px" }}>
      <div
        className="absolute w-[500px] h-[360px] rounded-full blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(16,185,129,0.22) 0%, transparent 70%)", zIndex: 0 }}
      />
      <div
        className="relative"
        style={{
          transform: `rotateX(${-mouse.y * 18}deg) rotateY(${mouse.x * 18}deg)`,
          transition: "transform 0.35s ease-out",
          transformStyle: "preserve-3d",
          zIndex: 1,
        }}
      >
        
        <div
          className="w-[400px] lg:w-[480px] rounded-3xl bg-white overflow-hidden"
          style={{
            boxShadow: "0 40px 100px rgba(0,0,0,0.15), 0 8px 32px rgba(16,185,129,0.15), 0 0 0 1px rgba(16,185,129,0.1)",
            animation: "floatCard 7s ease-in-out infinite",
            transformStyle: "preserve-3d",
          }}
        >
          
          <div className="h-[3px] w-full" style={{ background: "linear-gradient(90deg,#10b981,#0d9488,#34d399,#059669,#10b981)", backgroundSize: "300% 100%", animation: "gradShift 2.5s linear infinite" }} />
          
          <div className="px-5 py-4 flex items-center justify-between" style={{ background: "linear-gradient(135deg,#ecfdf5,#d1fae5)", borderBottom: "1px solid #a7f3d0" }}>
            <div>
              <p className="text-[8px] text-emerald-600 uppercase tracking-widest font-bold mb-0.5">Carbon Dashboard</p>
              <p className="text-sm font-black text-[#071a0b]">Q1 2025 Overview</p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-white text-[10px] font-bold" style={{ background: G, boxShadow: "0 2px 10px rgba(5,150,105,0.4)" }}>
              <CheckCircle2 className="w-3 h-3" /> Compliant
            </div>
          </div>
          
          <div className="grid grid-cols-3 bg-white" style={{ borderBottom: "1px solid #f0fdf4" }}>
            {[
              { label: "Total tCO₂e", val: "2,847", color: "#071a0b" },
              { label: "CBAM Liability", val: "€143k", color: "#059669" },
              { label: "Certs Required", val: "1,204", color: "#0d9488" },
            ].map((s, i) => (
              <div key={i} className="px-4 py-3" style={{ borderRight: i < 2 ? "1px solid #f0fdf4" : "none" }}>
                <p className="text-[8px] text-[#071a0b]/30 uppercase tracking-wider font-semibold mb-0.5">{s.label}</p>
                <p className="text-sm font-black leading-none" style={{ color: s.color }}>{s.val}</p>
              </div>
            ))}
          </div>
          
          <div className="px-5 pt-4 pb-2 bg-white">
            <p className="text-[8px] text-[#071a0b]/30 uppercase tracking-widest mb-3 font-semibold">Monthly Embedded Emissions (tCO₂e)</p>
            <div className="flex items-end gap-[3px] h-16">
              {BAR_HEIGHTS.map((h, i) => (
                <div key={i} className="flex-1 rounded-t" style={{
                  height: `${h}%`,
                  background: i === 11 ? "linear-gradient(180deg,#34d399,#059669)"
                    : i >= 9 ? "linear-gradient(180deg,#6ee7b7,#10b981)"
                      : "linear-gradient(180deg,#d1fae5,#a7f3d0)",
                  boxShadow: i === 11 ? "0 -4px 12px rgba(52,211,153,0.5)" : "none",
                }} />
              ))}
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-[8px] text-[#071a0b]/25">Jan</span>
              <span className="text-[8px] text-emerald-500 font-bold">↓ Trending down</span>
              <span className="text-[8px] text-[#071a0b]/25">Dec</span>
            </div>
          </div>
          
          <div className="px-5 py-4 bg-white" style={{ borderTop: "1px solid #f0fdf4" }}>
            {[
              { label: "Scope 1 — Direct combustion", pct: 28 },
              { label: "Scope 2 — Purchased energy", pct: 45 },
              { label: "Scope 3 — Supply chain", pct: 73 },
            ].map(s => (
              <div key={s.label} className="mb-2 last:mb-0">
                <div className="flex justify-between mb-1">
                  <span className="text-[8px] text-[#071a0b]/40 font-medium">{s.label}</span>
                  <span className="text-[8px] font-black text-[#071a0b]">{s.pct}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden bg-emerald-50">
                  <div className="h-full rounded-full" style={{ width: `${s.pct}%`, background: G }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        
        {[
          { side: "top-left", style: { top: "-52px", left: "-52px" }, anim: "floatChipB 5.5s 2s ease-in-out infinite", content: <><div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg,#ecfdf5,#d1fae5)", border: "1px solid #a7f3d0" }}><Users className="w-3.5 h-3.5 text-emerald-600" /></div><div><p className="text-[9px] text-[#071a0b]/35 uppercase tracking-wider font-semibold">Suppliers</p><p className="text-xs font-black text-[#071a0b]">12 verified</p></div></> },
          { side: "top-right", style: { top: "-52px", right: "-52px" }, anim: "floatChipA 5s ease-in-out infinite", content: <><div className="flex items-center gap-1.5 mb-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /><p className="text-[9px] text-[#071a0b]/35 uppercase tracking-wider font-semibold">Total Emissions</p></div><p className="text-sm font-black text-[#071a0b]">2,847 <span className="text-xs font-normal text-[#071a0b]/30">tCO₂e</span></p></> },
          { side: "bot-left", style: { bottom: "-52px", left: "-52px" }, anim: "floatChipA 4.5s 0.8s ease-in-out infinite", content: <><div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg,#ecfdf5,#d1fae5)", border: "1px solid #a7f3d0" }}><ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /></div><div><p className="text-[9px] text-[#071a0b]/35 uppercase tracking-wider font-semibold">Declaration</p><p className="text-xs font-black text-emerald-600">Q1 2025 ✓</p></div></> },
          { side: "bot-right", style: { bottom: "-52px", right: "-52px" }, anim: "floatChipB 6s 1s ease-in-out infinite", content: <><div className="flex items-center gap-1.5 mb-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" style={{ boxShadow: "0 0 6px #10b981" }} /><p className="text-[9px] text-[#071a0b]/35 uppercase tracking-wider font-semibold">CBAM Liability</p></div><p className="text-sm font-black text-emerald-600">€ 143k</p></> },
        ].map(({ side, style, anim, content }) => (
          <div key={side} className="absolute z-20" style={{ ...style, transform: "translateZ(60px)" }}>
            <div style={{ animation: anim }}>
              <div className="bg-white rounded-2xl px-3.5 py-3 flex items-center gap-2.5" style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.1), 0 0 0 1px rgba(16,185,129,0.18)" }}>
                {content}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}



function HowItWorksSection() {
  return (
    <section className="relative z-10 bg-background py-14 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="inline-block px-3 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-bold mb-4">HOW IT WORKS</span>
          <h3 className="text-4xl lg:text-5xl font-black text-foreground mb-3">
            From raw data to <span style={GRAD_TEXT}>full compliance</span>
          </h3>
          <p className="text-muted-foreground text-sm">Three steps. No spreadsheets. No penalties.</p>
        </div>
        <div className="flex flex-col lg:flex-row items-stretch gap-0">
          {STEPS.map((step, i) => (
            <div key={step.num} className="flex flex-col lg:flex-row items-stretch flex-1">
              <TiltCard
                className="flex-1 relative bg-white rounded-2xl p-7 group cursor-default overflow-hidden"
                style={{ boxShadow: "0 4px 24px rgba(16,185,129,0.08), 0 1px 4px rgba(0,0,0,0.04)", border: "1.5px solid rgba(16,185,129,0.15)" }}
              >
                <div className="absolute -top-3 -right-2 text-8xl font-black select-none leading-none" style={{ color: "rgba(16,185,129,0.07)" }}>{step.num}</div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5" style={{ background: "linear-gradient(135deg,#ecfdf5,#d1fae5)", border: "1px solid #a7f3d0" }}>
                  <step.icon className="w-6 h-6 text-emerald-600" />
                </div>
                <h4 className="text-base font-black text-foreground mb-2">{step.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </TiltCard>
              {i < STEPS.length - 1 && <StepConnector />}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}



function FeaturesSection() {
  return (
    <section className="relative z-10 bg-background py-14 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="inline-block px-3 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-bold mb-4">FEATURES</span>
          <h3 className="text-4xl lg:text-5xl font-black text-foreground mb-3">Everything in one platform</h3>
          <p className="text-muted-foreground text-sm">From data collection to regulatory reporting — no other tool needed</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(f => (
            <TiltCard
              key={f.title}
              className="relative bg-white rounded-2xl p-6 cursor-default overflow-hidden group"
              style={{ boxShadow: "0 2px 20px rgba(0,0,0,0.05), 0 1px 4px rgba(0,0,0,0.03)", border: "1.5px solid rgba(16,185,129,0.12)" }}
            >
              <div className="absolute inset-0 bg-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
              <div className="relative">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: G, boxShadow: "0 6px 20px rgba(5,150,105,0.25)" }}>
                  <f.icon className="w-5 h-5 text-white" />
                </div>
                <h4 className="font-black text-sm text-foreground mb-2">{f.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                <div className="flex items-center gap-1 mt-4 text-muted-foreground/40 group-hover:text-primary transition-colors">
                  <span className="text-[11px] font-semibold">Learn more</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </TiltCard>
          ))}
        </div>
      </div>
    </section>
  )
}



function CBAMTimelineSection({ openRegister }: any) {
  return (
    <section className="relative z-10 bg-background py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block px-3 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-bold mb-4">CBAM ENFORCEMENT TIMELINE</span>
          <h3 className="text-4xl lg:text-5xl font-black text-foreground mb-3">
            Are you ready for <span style={GRAD_TEXT}>CBAM?</span>
          </h3>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto">
            The EU Carbon Border Adjustment Mechanism is live. Importers of steel, cement, aluminium, fertilisers, electricity and hydrogen face growing financial obligations — with penalties already in effect.
          </p>
        </div>
        <div className="space-y-5 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-6">
          {CBAM_PHASES.map((phase, i) => (
            <TiltCard
              key={phase.year}
              className={`relative ${i === 1 ? "lg:mt-6" : ""}`}
              style={phase.status === "active" ? {
                background: G,
                borderRadius: 16, border: "1.5px solid rgba(16,185,129,0.4)",
                boxShadow: "0 24px 60px rgba(5,150,105,0.25), 0 4px 16px rgba(16,185,129,0.2)",
                padding: 24,
              } : {
                background: "hsl(var(--card))",
                borderRadius: 16, border: "1.5px solid hsl(var(--border))",
                boxShadow: "0 4px 20px rgba(0,0,0,0.04)",
                padding: 24,
                opacity: phase.status === "future" ? 0.7 : 1,
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className={`text-3xl font-black ${phase.status === "active" ? "text-white/90" : phase.status === "done" ? "text-muted-foreground/50" : "text-muted-foreground/30"}`}>{phase.year}</span>
                {phase.status === "active" && (
                  <span className="px-2 py-0.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Now
                  </span>
                )}
                {phase.status === "done" && (
                  <span className="px-2 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">Passed</span>
                )}
              </div>
              <h4 className={`font-black text-sm mb-2 ${phase.status === "active" ? "text-white" : "text-foreground"}`}>{phase.label}</h4>
              <p className={`text-xs leading-relaxed ${phase.status === "active" ? "text-white/70" : "text-muted-foreground"}`}>{phase.desc}</p>
            </TiltCard>
          ))}
        </div>
        <div className="text-center mt-12">
          <button
            onClick={openRegister}
            className="inline-flex items-center gap-2 px-7 py-3.5 text-white text-sm font-bold rounded-xl transition-all hover:scale-[1.03]"
            style={{ background: G, boxShadow: SHADOW }}
          >
            <Clock className="w-4 h-4" /> Get CBAM Compliant Now
          </button>
        </div>
      </div>
    </section>
  )
}



const CTA_URGENCY = [
  { icon: AlertTriangle, label: "CBAM is live", desc: "Financial penalties for EU importers are now in effect" },
  { icon: ShieldCheck, label: "6 sectors", desc: "Cement · Steel · Aluminium · Fertilisers · Electricity · Hydrogen" },
  { icon: Clock, label: "31 Mar 2026", desc: "Authorised Declarant registration deadline approaching fast" },
]

function CTASection({ openRegister }: any) {
  return (
    <section className="relative z-10 text-center py-14 px-6 bg-background">
      <div className="relative max-w-3xl mx-auto">
        <span className="inline-block px-3 py-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-bold mb-6">START TODAY</span>
        <h3 className="text-5xl lg:text-6xl font-black mb-5 leading-[1.06] text-foreground">
          Your net-zero journey<br />
          <span style={GRAD_TEXT}>starts here</span>
        </h3>
        <p className="text-muted-foreground text-sm mb-10 max-w-xl mx-auto leading-relaxed">
          Join companies already tracking, reporting, and reducing their carbon footprint — before CBAM penalties catch up.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10 max-w-2xl mx-auto text-left">
          {CTA_URGENCY.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="rounded-xl p-4 bg-card border border-border">
              <div className="flex items-center gap-2 mb-1.5">
                <Icon className="w-4 h-4 flex-shrink-0 text-primary" />
                <span className="text-xs font-bold text-primary">{label}</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
        <button
          onClick={openRegister}
          className="group inline-flex items-center gap-2 px-10 py-4 text-white rounded-xl text-sm font-bold transition-all hover:scale-[1.04]"
          style={{ background: G, boxShadow: SHADOW }}
        >
          {LABELS.BTN_GET_STARTED} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </section>
  )
}



function Navbar({ token, openSignIn, openRegister }: any) {
  const navigate = useNavigate()
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-30 h-20 px-6"
      style={{
        background: "hsl(var(--background) / 0.95)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid hsl(var(--border))",
      }}
    >
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <CompanyLogo size={44} />
          <div>
            <h1 className="text-lg font-black tracking-tight leading-none text-foreground">{LABELS.BRAND_NAME}</h1>
            <p className="text-[9px] uppercase tracking-widest font-bold leading-none mt-1 text-primary">{LABELS.BRAND_SUBTITLE}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {token ? (
            <button
              onClick={() => navigate("/Dashboard")}
              className="px-5 py-2.5 text-white rounded-xl text-sm font-bold transition-all hover:scale-[1.02]"
              style={{ background: G, boxShadow: SHADOW }}
            >
              {LABELS.NAV_DASHBOARD} <ArrowRight className="w-4 h-4 inline ml-1" />
            </button>
          ) : (
            <>
              <button onClick={openSignIn} className="px-5 py-2.5 text-sm font-semibold rounded-xl transition-all text-muted-foreground hover:text-foreground">
                {LABELS.NAV_SIGN_IN}
              </button>
              <button onClick={openRegister} className="px-5 py-2.5 text-white rounded-xl text-sm font-bold transition-all hover:scale-[1.02]" style={{ background: G, boxShadow: SHADOW }}>
                {LABELS.NAV_GET_STARTED}
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}


export default function Landing() {
  const [showAuth, setShowAuth] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  const { toasts, toast, removeToast } = useToast()
  const mouse = useMouseParallax()
  const token = localStorage.getItem("access_token")

  const openSignIn = () => { setShowAuth(true); setIsRegister(false) }
  const openRegister = () => { setShowAuth(true); setIsRegister(true) }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">


      
      <div
        className="fixed inset-0 pointer-events-none"
        aria-hidden
        style={{ backgroundImage: "radial-gradient(circle, rgba(16,185,129,0.11) 1px, transparent 1px)", backgroundSize: "36px 36px" }}
      />

      <Navbar token={token} openSignIn={openSignIn} openRegister={openRegister} />

      <HeroSection mouse={mouse} token={token} openRegister={openRegister} openSignIn={openSignIn} />
      <HowItWorksSection />
      <FeaturesSection />
      <CBAMTimelineSection openRegister={openRegister} />
      {!token && <CTASection openRegister={openRegister} />}

      
      <style>{`
        @keyframes floatCard   { 0%,100% { transform: translateY(0);    } 50% { transform: translateY(-10px); } }
        @keyframes floatChipA  { 0%,100% { transform: translateY(0) rotate(-0.5deg); } 50% { transform: translateY(-10px) rotate(0.5deg);  } }
        @keyframes floatChipB  { 0%,100% { transform: translateY(0) rotate(0.5deg);  } 50% { transform: translateY(-8px)  rotate(-0.5deg); } }
        @keyframes simplePulse { 0%,100% { opacity: 0.35; transform: scale(0.9); } 50% { opacity: 1; transform: scale(1.1); } }
        @keyframes gradShift   { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
      `}</style>

      <AuthModal
        showAuth={showAuth}
        setShowAuth={setShowAuth}
        isRegister={isRegister}
        setIsRegister={setIsRegister}
        toast={toast}
      />
    </div>
  )
}
