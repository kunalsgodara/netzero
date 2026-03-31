const db = globalThis.__B44_DB__;

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3 } from "lucide-react";

const INDUSTRY_BENCHMARKS = {
  manufacturing: { scope1: 420, scope2: 290, scope3: 180, unit: "kgCO₂e/£1000 revenue" },
  construction: { scope1: 310, scope2: 210, scope3: 740, unit: "kgCO₂e/£1000 revenue" },
  energy: { scope1: 890, scope2: 160, scope3: 240, unit: "kgCO₂e/£1000 revenue" },
  chemicals: { scope1: 520, scope2: 390, scope3: 340, unit: "kgCO₂e/£1000 revenue" },
  metals: { scope1: 780, scope2: 450, scope3: 190, unit: "kgCO₂e/£1000 revenue" },
  logistics: { scope1: 620, scope2: 130, scope3: 380, unit: "kgCO₂e/£1000 revenue" },
};

export default function Benchmarking() {
  const { data: activities = [] } = useQuery({ queryKey: ["emissions"], queryFn: () => db.entities.EmissionActivity.list("-created_date", 200) });
  const { data: orgs = [] } = useQuery({ queryKey: ["orgs"], queryFn: () => db.entities.Organization.list("-created_date", 1) });

  const org = orgs[0];
  const industry = org?.industry || "manufacturing";
  const benchmark = INDUSTRY_BENCHMARKS[industry] || INDUSTRY_BENCHMARKS.manufacturing;

  const scope1 = activities.filter(a => a.scope === "scope_1").reduce((s, a) => s + (a.co2e_kg || 0), 0) / 1000;
  const scope2 = activities.filter(a => a.scope === "scope_2").reduce((s, a) => s + (a.co2e_kg || 0), 0) / 1000;
  const scope3 = activities.filter(a => a.scope === "scope_3").reduce((s, a) => s + (a.co2e_kg || 0), 0) / 1000;
  const total = scope1 + scope2 + scope3;

  const revenue = org?.revenue_gbp_m || 1;
  const yourIntensities = {
    scope1: (scope1 * 1000) / revenue,
    scope2: (scope2 * 1000) / revenue,
    scope3: (scope3 * 1000) / revenue,
    total: (total * 1000) / revenue,
  };
  const benchTotal = benchmark.scope1 + benchmark.scope2 + benchmark.scope3;

  const CompareBar = ({ label, yours, industry }) => {
    const max = Math.max(yours, industry, 1);
    return (
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs"><span className="font-medium">{label}</span><span className="text-muted-foreground">{yours.toFixed(0)} vs {industry} {benchmark.unit}</span></div>
        <div className="flex gap-1 h-6">
          <div className="bg-primary/20 rounded-l-lg relative" style={{ width: `${(yours / max) * 100}%` }}>
            <div className="absolute inset-0 bg-primary rounded-l-lg" style={{ opacity: 0.7 }} /><span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-primary-foreground font-semibold">You</span>
          </div>
          <div className="bg-muted rounded-r-lg relative" style={{ width: `${(industry / max) * 100}%` }}>
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-medium">Industry</span>
          </div>
        </div>
      </div>
    );
  };

  const performanceScore = Math.max(0, Math.min(100, Math.round(100 - ((yourIntensities.total / benchTotal) * 100 - 100))));

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center"><BarChart3 className="w-5 h-5 text-violet-600" /></div>
        <div><h1 className="text-xl font-bold text-foreground">Benchmarking</h1><p className="text-xs text-muted-foreground">Compare against industry peers ({industry})</p></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 text-center">
          <p className="text-[10px] text-muted-foreground uppercase">Your Score</p>
          <p className={`text-4xl font-bold mt-2 ${performanceScore >= 60 ? "text-green-600" : performanceScore >= 40 ? "text-amber-500" : "text-red-500"}`}>{performanceScore}</p>
          <p className="text-xs text-muted-foreground mt-1">out of 100</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 text-center">
          <p className="text-[10px] text-muted-foreground uppercase">Your Intensity</p>
          <p className="text-2xl font-bold mt-2">{yourIntensities.total.toFixed(0)}</p>
          <p className="text-xs text-muted-foreground mt-1">{benchmark.unit}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5 text-center">
          <p className="text-[10px] text-muted-foreground uppercase">Industry Average</p>
          <p className="text-2xl font-bold mt-2 text-muted-foreground">{benchTotal}</p>
          <p className="text-xs text-muted-foreground mt-1">{benchmark.unit}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-5">
        <h3 className="text-base font-semibold">Scope Comparison</h3>
        <CompareBar label="Scope 1 (Direct)" yours={yourIntensities.scope1} industry={benchmark.scope1} />
        <CompareBar label="Scope 2 (Energy)" yours={yourIntensities.scope2} industry={benchmark.scope2} />
        <CompareBar label="Scope 3 (Supply Chain)" yours={yourIntensities.scope3} industry={benchmark.scope3} />
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <strong>Note:</strong> Benchmarks are based on industry averages. Full radar score analysis with detailed peer comparisons is a planned future feature.
        </p>
      </div>
    </div>
  );
}
