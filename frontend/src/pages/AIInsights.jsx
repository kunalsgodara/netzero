import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  RefreshCw,
  AlertTriangle,
  TrendingDown,
  CheckCircle2,
  Lightbulb,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  ArrowRight,
  BarChart3,
  Leaf,
  Zap,
  Clock,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";

const db = globalThis.__B44_DB__;

// ── Helpers ──────────────────────────────────────────────────────────────────

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

// ── Sub-components ────────────────────────────────────────────────────────────



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

// ── Main Component ────────────────────────────────────────────────────────────

export default function AIInsights() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const { data: activities = [] } = useQuery({
    queryKey: ["emissions"],
    queryFn: () => db.entities.EmissionActivity.list("-created_date", 200),
  });
  const { data: imports = [] } = useQuery({
    queryKey: ["cbam-imports"],
    queryFn: () => db.entities.CBAMImport.list("-created_date", 200),
  });

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

    const prompt = `You are a senior AI carbon compliance advisor analyzing data for a NetZeroWorks client.

DATA SUMMARY:
- Total Emissions: ${stats.total.toFixed(1)} tCO₂e
  * Scope 1 (Direct, e.g., fuel combustion): ${stats.scope1.toFixed(1)} tCO₂e
  * Scope 2 (Electricity): ${stats.scope2.toFixed(1)} tCO₂e
  * Scope 3 (Value chain): ${stats.scope3.toFixed(1)} tCO₂e
- CBAM Imports: ${stats.importCount} entries, Total estimated CBAM charge: €${stats.totalCBAM.toFixed(0)}
- CBAM Embedded Emissions by Category: ${JSON.stringify(stats.categories)}

INSTRUCTIONS:
Produce a structured, actionable JSON analysis. Be specific, data-driven and concise.
For anomalies: flag anything unusual, e.g. high Scope 2 vs Scope 1, excessive CBAM charges for a single category, or missing data.
For recommendations: provide 3-4 ranked by impact. Each must include an "action_type" field that is one of: PLANNER, CBAM, or EMISSIONS (to allow UI deep-linking).
For compliance_status.level: use exactly one of: "good", "warning", or "critical".`;

    const schema = {
      type: "object",
      properties: {
        overall_summary: { type: "string" },
        compliance_status: {
          type: "object",
          properties: {
            level: { type: "string" },
            summary: { type: "string" },
            cbam_risk_level: { type: "string" },
          },
        },
        key_metrics: {
          type: "object",
          properties: {
            largest_scope: { type: "string" },
            emission_intensity_assessment: { type: "string" },
            cbam_exposure: { type: "string" },
          },
        },
        anomalies: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              severity: { type: "string" },
            },
          },
        },
        reduction_recommendations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              estimated_savings_pct: { type: "number" },
              difficulty: { type: "string" },
              timeline: { type: "string" },
              action_type: { type: "string" },
            },
          },
        },
        cbam_guidance: { type: "string" },
      },
    };

    try {
      const result = await db.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
      setInsights(result);
    } catch (e) {
      setError("Failed to generate insights. Please check your API key or try again.");
    } finally {
      setLoading(false);
    }
  };

  const complianceCfg = insights?.compliance_status
    ? COMPLIANCE_CONFIG[insights.compliance_status.level] || COMPLIANCE_CONFIG.warning
    : null;

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-purple-600" />
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



      {/* Empty state */}
      {!insights && !loading && !error && (
        <div className="border-2 border-dashed border-border rounded-xl py-20 text-center">
          <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground">AI-Powered Analysis</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            Click <strong>Generate Insights</strong> to analyse your emissions and CBAM data and get tailored recommendations.
          </p>
        </div>
      )}

      {/* Loading skeleton */}
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

      {/* Error state */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-700">Analysis failed</p>
            <p className="text-xs text-red-600 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Generated Insights */}
      {insights && !loading && (
        <div className="space-y-5">
          {/* Overall summary */}
          {insights.overall_summary && (
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">Executive Summary</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{insights.overall_summary}</p>
            </div>
          )}

          {/* Compliance status + key metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Compliance */}
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

            {/* Key metrics */}
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

          {/* Anomalies + Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Anomalies */}
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

            {/* Reduction Recommendations */}
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

          {/* CBAM Guidance */}
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

          {/* Re-generate */}
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
  );
}
