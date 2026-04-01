import React, { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { FlaskConical, Sparkles, RefreshCw, Plus, X, TrendingDown } from "lucide-react";

const db = globalThis.__B44_DB__

const LEVERS = [
  { id: "renewables", name: "Switch to Renewables", default_pct: 30, scope: "scope_2" },
  { id: "ev_fleet", name: "Electrify Fleet", default_pct: 20, scope: "scope_1" },
  { id: "efficiency", name: "Energy Efficiency Upgrades", default_pct: 15, scope: "scope_1" },
  { id: "supply_chain", name: "Green Procurement Policy", default_pct: 10, scope: "scope_3" },
  { id: "travel", name: "Reduce Business Travel", default_pct: 25, scope: "scope_3" },
  { id: "carbon_offsets", name: "Carbon Offsets", default_pct: 5, scope: "scope_1" },
];

export default function ScenarioPlanner() {
  const [selectedLevers, setSelectedLevers] = useState([]);
  const [aiResult, setAiResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const { data: activitiesData = {} } = useQuery({ 
    queryKey: ["emissions-scenario"], 
    queryFn: async () => {
      const res = await fetch("/api/v1/emission-activities?page=1&page_size=1000&order_by=-created_date", {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
      });
      return res.json();
    }
  });
  const activities = activitiesData?.items || [];

  const scope1 = activities.filter(a => a.scope === "scope_1").reduce((s, a) => s + (a.co2e_kg || 0), 0) / 1000;
  const scope2 = activities.filter(a => a.scope === "scope_2").reduce((s, a) => s + (a.co2e_kg || 0), 0) / 1000;
  const scope3 = activities.filter(a => a.scope === "scope_3").reduce((s, a) => s + (a.co2e_kg || 0), 0) / 1000;
  const total = scope1 + scope2 + scope3;

  const addLever = (lever) => {
    if (!selectedLevers.find(l => l.id === lever.id)) {
      setSelectedLevers([...selectedLevers, { ...lever, pct: lever.default_pct }]);
    }
  };

  const removeLever = (id) => setSelectedLevers(selectedLevers.filter(l => l.id !== id));
  const updateLeverPct = (id, pct) => setSelectedLevers(selectedLevers.map(l => l.id === id ? { ...l, pct } : l));

  const projectedReduction = selectedLevers.reduce((sum, lever) => {
    const scopeEmissions = lever.scope === "scope_1" ? scope1 : lever.scope === "scope_2" ? scope2 : scope3;
    return sum + (scopeEmissions * lever.pct / 100);
  }, 0);
  const projectedTotal = Math.max(0, total - projectedReduction);
  const reductionPct = total > 0 ? ((projectedReduction / total) * 100).toFixed(1) : 0;

  const analyzeWithAI = async () => {
    setLoading(true);
    const result = await db.integrations.Core.InvokeLLM({
      prompt: `You are a carbon management strategist. Analyze this scenario:
Current emissions: Scope1=${scope1.toFixed(1)}, Scope2=${scope2.toFixed(1)}, Scope3=${scope3.toFixed(1)} tCO₂e
Selected levers: ${selectedLevers.map(l => `${l.name} (${l.pct}% reduction on ${l.scope})`).join(", ")}
Projected: ${projectedTotal.toFixed(1)} tCO₂e (${reductionPct}% reduction)

Provide strategic analysis in JSON.`,
      response_json_schema: { type: "object", properties: { feasibility: { type: "string" }, timeline: { type: "string" }, estimated_cost_range: { type: "string" }, recommendations: { type: "array", items: { type: "string" } }, risks: { type: "array", items: { type: "string" } } } }
    });
    setAiResult(result);
    setLoading(false);
  };

  const availableLevers = LEVERS.filter(l => !selectedLevers.find(s => s.id === l.id));

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><FlaskConical className="w-5 h-5 text-primary" /></div>
          <div><h1 className="text-xl font-bold text-foreground">Scenario Planner</h1><p className="text-xs text-muted-foreground">Model reduction pathways with AI optimization</p></div>
        </div>
        {selectedLevers.length > 0 && (
          <button onClick={analyzeWithAI} disabled={loading} className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
            {loading ? <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1.5" />}
            {loading ? "Analyzing..." : "AI Analysis"}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 text-center"><p className="text-[10px] text-muted-foreground uppercase">Current</p><p className="text-2xl font-bold text-foreground mt-1">{total.toFixed(1)} <span className="text-sm font-normal">tCO₂e</span></p></div>
        <div className="bg-card border border-border rounded-xl p-5 text-center"><p className="text-[10px] text-muted-foreground uppercase">Projected</p><p className="text-2xl font-bold text-primary mt-1">{projectedTotal.toFixed(1)} <span className="text-sm font-normal">tCO₂e</span></p></div>
        <div className="bg-card border border-border rounded-xl p-5 text-center"><p className="text-[10px] text-muted-foreground uppercase">Reduction</p><p className="text-2xl font-bold text-green-600 mt-1">↓{reductionPct}%</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="text-base font-semibold">Selected Levers</h3>
          {selectedLevers.length === 0 && <p className="text-xs text-muted-foreground text-center py-6">Add levers from below</p>}
          {selectedLevers.map(lever => (
            <div key={lever.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className="flex-1">
                <p className="text-xs font-semibold">{lever.name}</p>
                <p className="text-[10px] text-muted-foreground">{lever.scope.replace("_", " ").toUpperCase()}</p>
              </div>
              <input type="range" min="1" max="100" value={lever.pct} onChange={(e) => updateLeverPct(lever.id, parseInt(e.target.value))} className="w-24 accent-primary" />
              <span className="text-xs font-mono font-bold text-primary w-10 text-right">{lever.pct}%</span>
              <button onClick={() => removeLever(lever.id)} className="p-1 hover:bg-muted rounded"><X className="w-3.5 h-3.5 text-muted-foreground" /></button>
            </div>
          ))}
        </div>
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <h3 className="text-base font-semibold">Available Levers</h3>
          {availableLevers.map(lever => (
            <button key={lever.id} onClick={() => addLever(lever)} className="w-full flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left">
              <div>
                <p className="text-xs font-semibold">{lever.name}</p>
                <p className="text-[10px] text-muted-foreground">{lever.scope.replace("_"," ").toUpperCase()} · ~{lever.default_pct}% default reduction</p>
              </div>
              <Plus className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>

      {aiResult && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h3 className="text-base font-semibold flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> AI Analysis</h3>
          {aiResult.feasibility && <div className="p-3 bg-muted/50 rounded-lg"><p className="text-xs font-semibold mb-1">Feasibility</p><p className="text-xs text-muted-foreground">{aiResult.feasibility}</p></div>}
          {aiResult.timeline && <div className="p-3 bg-muted/50 rounded-lg"><p className="text-xs font-semibold mb-1">Timeline</p><p className="text-xs text-muted-foreground">{aiResult.timeline}</p></div>}
          {aiResult.estimated_cost_range && <div className="p-3 bg-muted/50 rounded-lg"><p className="text-xs font-semibold mb-1">Est. Cost</p><p className="text-xs text-muted-foreground">{aiResult.estimated_cost_range}</p></div>}
          {aiResult.recommendations?.length > 0 && (
            <div><p className="text-xs font-semibold mb-2">Recommendations</p><ul className="space-y-1">{aiResult.recommendations.map((r, i) => <li key={i} className="text-xs text-muted-foreground pl-3 relative"><span className="absolute left-0">•</span>{r}</li>)}</ul></div>
          )}
          {aiResult.risks?.length > 0 && (
            <div><p className="text-xs font-semibold mb-2">Risks</p><ul className="space-y-1">{aiResult.risks.map((r, i) => <li key={i} className="text-xs text-muted-foreground pl-3 relative"><span className="absolute left-0 text-amber-500">⚠</span>{r}</li>)}</ul></div>
          )}
        </div>
      )}
    </div>
  );
}
