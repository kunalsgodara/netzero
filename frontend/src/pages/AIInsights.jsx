import React, { useState, useMemo } from "react";
import LABELS from "@/utils/labels";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Sparkles, RefreshCw, AlertTriangle, TrendingDown, CheckCircle2,
  Lightbulb, ShieldCheck, ShieldAlert, ShieldX, ArrowRight,
  BarChart3, Leaf, Zap, Clock, ChevronDown, ChevronUp, Info, XCircle,
} from "lucide-react";


function authHeaders() {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiFetch(path) {
  const res = await fetch(path, { headers: authHeaders() });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

async function callLLM(prompt, response_json_schema) {
  const res = await fetch("/api/integrations/llm/invoke", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ prompt, response_json_schema }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}



const SEVERITY_CONFIG = {
  low: {
    icon: <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />,
    badge: "bg-green-100 text-green-700 border-green-200",
    border: "border-l-green-400",
  },
  medium: {
    icon: <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />,
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    border: "border-l-amber-400",
  },
  high: {
    icon: <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />,
    badge: "bg-red-100 text-red-700 border-red-200",
    border: "border-l-red-400",
  },
};

const COMPLIANCE_CONFIG = {
  good: {
    icon: <ShieldCheck className="w-5 h-5 text-green-600" />,
    style: "border-l-4 border-green-500 bg-green-50",
    badge: "bg-green-100 text-green-700",
    label: "Compliant",
  },
  warning: {
    icon: <ShieldAlert className="w-5 h-5 text-amber-600" />,
    style: "border-l-4 border-amber-500 bg-amber-50",
    badge: "bg-amber-100 text-amber-700",
    label: "Warning",
  },
  critical: {
    icon: <ShieldX className="w-5 h-5 text-red-600" />,
    style: "border-l-4 border-red-500 bg-red-50",
    badge: "bg-red-100 text-red-700",
    label: "Critical",
  },
};

const DIFFICULTY_CONFIG = {
  low: { label: "Low effort", color: "text-green-600", dotColor: "bg-green-500" },
  medium: { label: "Medium effort", color: "text-amber-600", dotColor: "bg-amber-500" },
  hard: { label: "High effort", color: "text-red-600", dotColor: "bg-red-500" },
};

const ACTION_TYPE_CONFIG = {
  PLANNER: { label: "Open in Scenario Planner", icon: <BarChart3 className="w-3 h-3" />, route: "/ScenarioPlanner" },
  CBAM: { label: "Go to CBAM Manager", icon: <Leaf className="w-3 h-3" />, route: "/CBAMManager" },
  EMISSIONS: { label: "Review Emissions", icon: <Zap className="w-3 h-3" />, route: "/Emissions" },
};



function AnomalyCard({ anomaly }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = SEVERITY_CONFIG[anomaly.severity] || SEVERITY_CONFIG.medium;
  return (
    <div className={`p-4 rounded-lg bg-muted/40 border-l-4 ${cfg.border} transition-all`}>
      <div className="flex items-start gap-3">
        {cfg.icon}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-foreground">{anomaly.title}</p>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 border rounded-full flex-shrink-0 ${cfg.badge}`}>
              {anomaly.severity}
            </span>
          </div>
          {anomaly.description && (
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {expanded ? anomaly.description : `${anomaly.description.slice(0, 90)}${anomaly.description.length > 90 ? "…" : ""}`}
            </p>
          )}
          {anomaly.description?.length > 90 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-1 flex items-center gap-0.5 text-[10px] text-primary hover:underline"
            >
              {expanded ? <><ChevronUp className="w-3 h-3" /> Less</> : <><ChevronDown className="w-3 h-3" /> More</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function RecommendationCard({ rec, navigate }) {
  const diff = DIFFICULTY_CONFIG[rec.difficulty?.toLowerCase()] || DIFFICULTY_CONFIG.medium;
  const action = ACTION_TYPE_CONFIG[rec.action_type];

  return (
    <div className="p-4 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors group">
      <div className="flex items-start gap-3">
        <Lightbulb className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground">{rec.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{rec.description}</p>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            {rec.estimated_savings_pct != null && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-primary">
                <TrendingDown className="w-3 h-3" />↓ {rec.estimated_savings_pct}% savings
              </span>
            )}
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className={`w-1.5 h-1.5 rounded-full ${diff.dotColor}`} />
              <span className={diff.color}>{diff.label}</span>
            </span>
            {rec.timeline && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock className="w-3 h-3" />{rec.timeline}
              </span>
            )}
          </div>
          {action && (
            <button
              onClick={() => navigate(action.route)}
              className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-primary hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {action.icon}
              {action.label}
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}



export default function AIInsights() {
  const [insights, setInsights] = useState(() => {
    try {
      const saved = localStorage.getItem("ai_insights");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const { data: activitiesData = {} } = useQuery({
    queryKey: ["emissions-ai"],
    queryFn: () => apiFetch("/api/v1/emission-activities?page=1&page_size=1000&order_by=-created_date"),
  });
  const activities = activitiesData?.items || [];
  
  const { data: importsData = {} } = useQuery({
    queryKey: ["cbam-imports-ai"],
    queryFn: () => apiFetch("/api/v1/cbam-imports?page=1&page_size=1000&order_by=-created_date"),
  });
  const imports = importsData?.items || [];

  const stats = useMemo(() => {
    const totalKg = activities.reduce((s, a) => s + (a.co2e_kg || 0), 0);
    const scope1 = activities.filter(a => a.scope === "scope_1").reduce((s, a) => s + (a.co2e_kg || 0), 0) / 1000;
    const scope2 = activities.filter(a => a.scope === "scope_2").reduce((s, a) => s + (a.co2e_kg || 0), 0) / 1000;
    const scope3 = activities.filter(a => a.scope === "scope_3").reduce((s, a) => s + (a.co2e_kg || 0), 0) / 1000;
    const total = totalKg / 1000;
    const totalCBAM = imports.reduce((s, i) => s + (i.cbam_charge_eur || 0), 0);
    const categories = {};
    imports.forEach(i => { categories[i.category] = (categories[i.category] || 0) + (i.embedded_emissions || 0); });
    return { total, scope1, scope2, scope3, totalCBAM, categories, importCount: imports.length };
  }, [activities, imports]);

  const generateInsights = async () => {
    setLoading(true);
    setError(null);
    setInsights(null);

    const hasData = activities.length > 0 || imports.length > 0;

    const prompt = `You are a senior AI carbon compliance advisor for a carbon management platform called ${LABELS.BRAND_NAME}.

${hasData
  ? `COMPANY DATA:
- Total Emissions: ${stats.total.toFixed(1)} tCO2e
  - Scope 1 (Direct combustion): ${stats.scope1.toFixed(1)} tCO2e
  - Scope 2 (Purchased electricity): ${stats.scope2.toFixed(1)} tCO2e
  - Scope 3 (Value chain): ${stats.scope3.toFixed(1)} tCO2e
- CBAM Imports: ${stats.importCount} entries, estimated CBAM charge: EUR ${stats.totalCBAM.toFixed(0)}
- CBAM by Category: ${JSON.stringify(stats.categories)}`
  : `COMPANY DATA: No emissions data recorded yet. This is a new user onboarding.`}

You MUST return a JSON object with ALL of these fields populated. DO NOT leave any array empty.

Return ONLY valid JSON matching this exact structure. Replace ALL placeholder values with your ACTUAL analysis — do not copy the example values literally:
{
  "overall_summary": "<your actual 2-3 sentence analysis>",
  "compliance_status": {
    "level": "<choose one: good | warning | critical — based on actual risk>",
    "summary": "<your actual one-sentence compliance assessment>",
    "cbam_risk_level": "<choose one: low | medium | high — based on actual CBAM exposure>"
  },
  "key_metrics": {
    "largest_scope": "<which scope dominates and why>",
    "emission_intensity_assessment": "<your actual intensity assessment>",
    "cbam_exposure": "<your actual CBAM exposure assessment>"
  },
  "anomalies": [
    {"title": "<actual anomaly 1>", "description": "<detailed explanation>", "severity": "<low|medium|high>"},
    {"title": "<actual anomaly 2>", "description": "<detailed explanation>", "severity": "<low|medium|high>"}
  ],
  "reduction_recommendations": [
    {"title": "<actual rec 1>", "description": "<specific action>", "estimated_savings_pct": <number>, "difficulty": "<low|medium|hard>", "timeline": "<timeframe>", "action_type": "EMISSIONS"},
    {"title": "<actual rec 2>", "description": "<specific action>", "estimated_savings_pct": <number>, "difficulty": "<low|medium|hard>", "timeline": "<timeframe>", "action_type": "PLANNER"},
    {"title": "<actual rec 3>", "description": "<specific action>", "estimated_savings_pct": <number>, "difficulty": "<low|medium|hard>", "timeline": "<timeframe>", "action_type": "CBAM"}
  ],
  "cbam_guidance": "<your actual CBAM guidance paragraph>"
}

RULES (strictly enforced):
- anomalies MUST have at least 2 real items. For new users: flag missing emissions data and missing CBAM setup
- reduction_recommendations MUST have exactly 3 real items with specific actionable advice
- compliance_status.level MUST reflect the actual data — use "warning" or "critical" if there are real risks
- action_type must be one of: PLANNER, CBAM, EMISSIONS
- difficulty must be one of: low, medium, hard`;

    const schema = null; 

    try {
      const result = await callLLM(prompt, schema);
      
      let parsedInsights = null;
      if (result.raw_response || result.response) {
        const raw = result.raw_response || result.response;
        try {
          const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
          parsedInsights = JSON.parse(cleaned);
        } catch {
          parsedInsights = result; 
        }
      } else {
        parsedInsights = result;
      }
      setInsights(parsedInsights);
      localStorage.setItem("ai_insights", JSON.stringify(parsedInsights));
    } catch (e) {
      setError(e.message || "Failed to generate insights. Please check your API key or try again.");
    } finally {
      setLoading(false);
    }
  };

  const complianceCfg = insights?.compliance_status
    ? COMPLIANCE_CONFIG[insights.compliance_status.level] || COMPLIANCE_CONFIG.warning
    : null;

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 overflow-auto">
        <div className="p-6 lg:p-8 max-w-[1400px] mx-auto h-full flex flex-col">
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">AI Insights</h1>
            <p className="text-xs text-muted-foreground">AI-powered compliance guidance &amp; reduction recommendations</p>
          </div>
        </div>
        <button
          onClick={generateInsights}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {loading ? <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1.5" />}
          {loading ? "Analyzing…" : "Generate Insights"}
        </button>
      </div>

      
      {error && !loading && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">Analysis Failed</p>
            <p className="text-xs text-red-600 mt-1">{error}</p>
            {error.includes("429") ? (
              <p className="text-xs text-amber-600 mt-2 font-medium">
                ⏳ Rate limit hit. Wait ~30 seconds and try again.
              </p>
            ) : (error.toLowerCase().includes("api key") || error.toLowerCase().includes("groq")) ? (
              <p className="text-xs text-red-500 mt-2 font-medium">
                → Add a valid Groq API key to <code className="bg-red-100 px-1 rounded">backend/.env</code> as{" "}
                <code className="bg-red-100 px-1 rounded">GROQ_API_KEY=your_key_here</code>, then restart the backend.
              </p>
            ) : null}
          </div>
        </div>
      )}

      
      {!insights && !loading && !error && (
        <div className="flex-1 flex items-center justify-center">
          <div className="border-2 border-dashed border-border rounded-xl py-16 px-8 text-center max-w-md">
            <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground">AI-Powered Analysis</h3>
            <p className="text-sm text-muted-foreground mt-2">
              Click <strong>Generate Insights</strong> to analyse your emissions and CBAM data and get tailored recommendations.
            </p>
          </div>
        </div>
      )}

      
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-6 animate-pulse">
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded w-1/3" />
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      
      {insights && !loading && (
        <div className="space-y-5">
          
          {insights.overall_summary && (
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">Executive Summary</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{insights.overall_summary}</p>
            </div>
          )}

          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {insights.compliance_status && complianceCfg && (
              <div className={`bg-card rounded-xl p-5 ${complianceCfg.style}`}>
                <div className="flex items-center gap-2 mb-2">
                  {complianceCfg.icon}
                  <h3 className="text-sm font-semibold text-foreground">Compliance Status</h3>
                  <span className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full ${complianceCfg.badge}`}>
                    {complianceCfg.label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{insights.compliance_status.summary}</p>
                {insights.compliance_status.cbam_risk_level && (
                  <p className="text-[10px] mt-2 text-muted-foreground">
                    CBAM risk: <span className="font-semibold">{insights.compliance_status.cbam_risk_level}</span>
                  </p>
                )}
              </div>
            )}

            {insights.key_metrics && (
              <div className="bg-card border border-border rounded-xl p-5 space-y-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-muted-foreground" /> Key Findings
                </h3>
                {[
                  { label: "Largest emission source", value: insights.key_metrics.largest_scope },
                  { label: "Intensity assessment", value: insights.key_metrics.emission_intensity_assessment },
                  { label: "CBAM exposure", value: insights.key_metrics.cbam_exposure },
                ]
                  .filter(m => m.value)
                  .map(m => (
                    <div key={m.label} className="flex flex-col gap-0.5">
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{m.label}</p>
                      <p className="text-xs text-foreground">{m.value}</p>
                    </div>
                  ))}
              </div>
            )}
          </div>

          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Anomalies Detected
                {insights.anomalies?.length > 0 && (
                  <span className="ml-auto text-[10px] font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                    {insights.anomalies.length} found
                  </span>
                )}
              </h3>
              <div className="space-y-3">
                {insights.anomalies?.length > 0
                  ? insights.anomalies.map((a, i) => <AnomalyCard key={i} anomaly={a} />)
                  : (
                    <div className="text-center py-6">
                      <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">No anomalies detected</p>
                    </div>
                  )}
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                <TrendingDown className="w-4 h-4 text-primary" />
                Reduction Recommendations
                {insights.reduction_recommendations?.length > 0 && (
                  <span className="ml-auto text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    {insights.reduction_recommendations.length} actions
                  </span>
                )}
              </h3>
              <div className="space-y-3">
                {insights.reduction_recommendations?.map((r, i) => (
                  <RecommendationCard key={i} rec={r} navigate={navigate} />
                ))}
              </div>
            </div>
          </div>

          
          {insights.cbam_guidance && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-amber-500" /> CBAM Strategy Guidance
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{insights.cbam_guidance}</p>
              <button
                onClick={() => navigate("/CBAMManager")}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
              >
                Go to CBAM Manager <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

          
          <div className="pt-1 flex justify-end">
            <button
              onClick={generateInsights}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Re-generate analysis
            </button>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}
