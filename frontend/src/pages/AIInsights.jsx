import React, { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { Sparkles, RefreshCw, AlertTriangle, TrendingDown, CheckCircle2, Lightbulb } from "lucide-react";

const db = globalThis.__B44_DB__

export default function AIInsights() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);

  const { data: activities = [] } = useQuery({ queryKey: ["emissions"], queryFn: () => db.entities.EmissionActivity.list("-created_date", 200) });
  const { data: imports = [] } = useQuery({ queryKey: ["cbam-imports"], queryFn: () => db.entities.CBAMImport.list("-created_date", 200) });

  const generateInsights = async () => {
    setLoading(true);
    const totalEmissions = activities.reduce((s, a) => s + (a.co2e_kg || 0), 0) / 1000;
    const scope1 = activities.filter(a => a.scope === "scope_1").reduce((s, a) => s + (a.co2e_kg || 0), 0) / 1000;
    const scope2 = activities.filter(a => a.scope === "scope_2").reduce((s, a) => s + (a.co2e_kg || 0), 0) / 1000;
    const scope3 = activities.filter(a => a.scope === "scope_3").reduce((s, a) => s + (a.co2e_kg || 0), 0) / 1000;
    const totalCBAM = imports.reduce((s, i) => s + (i.cbam_charge_eur || 0), 0);
    const categories = {};
    imports.forEach(i => { categories[i.category] = (categories[i.category] || 0) + (i.embedded_emissions || 0); });

    const prompt = `You are an AI carbon compliance advisor. Analyze:
- Total: ${totalEmissions.toFixed(1)} tCO₂e, Scope1: ${scope1.toFixed(1)}, Scope2: ${scope2.toFixed(1)}, Scope3: ${scope3.toFixed(1)}
- CBAM imports: ${imports.length}, charges: €${totalCBAM.toFixed(0)}, categories: ${JSON.stringify(categories)}
Provide structured JSON insights.`;

    const result = await db.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          compliance_status: { type: "object", properties: { level: { type: "string" }, summary: { type: "string" } } },
          anomalies: { type: "array", items: { type: "object", properties: { title: { type: "string" }, description: { type: "string" }, severity: { type: "string" } } } },
          reduction_recommendations: { type: "array", items: { type: "object", properties: { title: { type: "string" }, description: { type: "string" }, estimated_savings_pct: { type: "number" }, difficulty: { type: "string" } } } },
          cbam_guidance: { type: "string" },
          overall_summary: { type: "string" }
        }
      }
    });
    setInsights(result);
    setLoading(false);
  };

  const severityIcon = { low: <CheckCircle2 className="w-4 h-4 text-green-500" />, medium: <AlertTriangle className="w-4 h-4 text-amber-500" />, high: <AlertTriangle className="w-4 h-4 text-red-500" /> };
  const complianceColors = { good: "border-green-500 bg-green-50", warning: "border-amber-500 bg-amber-50", critical: "border-red-500 bg-red-50" };

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center"><Sparkles className="w-5 h-5 text-purple-600" /></div>
          <div><h1 className="text-xl font-bold text-foreground">AI Insights</h1><p className="text-xs text-muted-foreground">AI-powered compliance guidance & recommendations</p></div>
        </div>
        <button onClick={generateInsights} disabled={loading} className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
          {loading ? <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1.5" />}
          {loading ? "Analyzing..." : "Generate Insights"}
        </button>
      </div>

      {!insights && !loading && (
        <div className="border-2 border-dashed border-border rounded-xl py-20 text-center">
          <Sparkles className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">AI-Powered Analysis</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">Click "Generate Insights" to analyze your data and get recommendations.</p>
        </div>
      )}

      {loading && (
        <div className="space-y-4">{[1,2,3].map(i => (
          <div key={i} className="bg-card border border-border rounded-xl p-6"><div className="animate-pulse space-y-3"><div className="h-4 bg-muted rounded w-1/3" /><div className="h-3 bg-muted rounded w-full" /><div className="h-3 bg-muted rounded w-2/3" /></div></div>
        ))}</div>
      )}

      {insights && !loading && (
        <div className="space-y-6">
          {insights.overall_summary && (
            <div className="bg-card border border-border rounded-xl p-6"><p className="text-sm text-foreground leading-relaxed">{insights.overall_summary}</p></div>
          )}
          {insights.compliance_status && (
            <div className={`bg-card border-l-4 rounded-xl p-5 ${complianceColors[insights.compliance_status.level] || ""}`}>
              <p className="text-sm font-semibold capitalize">Compliance: {insights.compliance_status.level}</p>
              <p className="text-xs text-muted-foreground mt-1">{insights.compliance_status.summary}</p>
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-base font-semibold flex items-center gap-2 mb-3"><AlertTriangle className="w-4 h-4" /> Anomalies</h3>
              <div className="space-y-3">
                {insights.anomalies?.length > 0 ? insights.anomalies.map((a, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">{severityIcon[a.severity]}<div><p className="text-xs font-semibold">{a.title}</p><p className="text-xs text-muted-foreground mt-0.5">{a.description}</p></div></div>
                )) : <p className="text-xs text-muted-foreground text-center py-4">No anomalies detected</p>}
              </div>
            </div>
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-base font-semibold flex items-center gap-2 mb-3"><TrendingDown className="w-4 h-4" /> Recommendations</h3>
              <div className="space-y-3">
                {insights.reduction_recommendations?.map((r, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-start gap-2"><Lightbulb className="w-4 h-4 text-amber-500 mt-0.5" /><div><p className="text-xs font-semibold">{r.title}</p><p className="text-xs text-muted-foreground mt-0.5">{r.description}</p></div></div>
                    <div className="flex gap-4 mt-2 ml-6"><span className="text-[10px] text-primary font-semibold">↓ {r.estimated_savings_pct}% savings</span><span className="text-[10px] text-muted-foreground capitalize">Difficulty: {r.difficulty}</span></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {insights.cbam_guidance && (
            <div className="bg-card border border-border rounded-xl p-5"><h3 className="text-base font-semibold flex items-center gap-2 mb-3"><Lightbulb className="w-4 h-4" /> CBAM Guidance</h3><p className="text-sm text-muted-foreground leading-relaxed">{insights.cbam_guidance}</p></div>
          )}
        </div>
      )}
    </div>
  );
}
