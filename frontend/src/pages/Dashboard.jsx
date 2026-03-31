import React, { useEffect, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils/routes";
import { Activity, ShieldCheck, Flame, Zap, ArrowRight, Leaf } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from "recharts";
import { format } from "date-fns";

const db = globalThis.__B44_DB__

export default function Dashboard() {
  const [org, setOrg] = useState(null);

  const { data: activities = [] } = useQuery({
    queryKey: ["emissions"],
    queryFn: () => db.entities.EmissionActivity.list("-created_date", 200),
  });

  const { data: imports = [] } = useQuery({
    queryKey: ["cbam-imports"],
    queryFn: () => db.entities.CBAMImport.list("-created_date", 200),
  });

  const { data: orgs = [] } = useQuery({
    queryKey: ["orgs"],
    queryFn: () => db.entities.Organization.list("-created_date", 1),
  });

  useEffect(() => {
    if (orgs.length > 0) setOrg(orgs[0]);
  }, [orgs]);

  const totalEmissions = activities.reduce((s, a) => s + (a.co2e_kg || 0), 0) / 1000;
  const scope1 = activities.filter(a => a.scope === "scope_1").reduce((s, a) => s + (a.co2e_kg || 0), 0) / 1000;
  const scope2 = activities.filter(a => a.scope === "scope_2").reduce((s, a) => s + (a.co2e_kg || 0), 0) / 1000;
  const totalCBAMCharge = imports.reduce((s, i) => s + (i.cbam_charge_eur || 0), 0);

  const CATEGORY_LABELS = {
    cement: "Cement",
    iron_steel: "Iron & Steel",
    aluminum: "Aluminum",
    fertilizers: "Fertilizers",
    electricity: "Electricity",
    hydrogen: "Hydrogen",
  };

  const CATEGORY_COLORS = {
    cement: "#8b5cf6",
    iron_steel: "#64748b",
    aluminum: "#94a3b8",
    fertilizers: "#10b981",
    electricity: "#f59e0b",
    hydrogen: "#06b6d4",
  };

  const cbamCategoryData = Object.keys(CATEGORY_LABELS).map(key => {
    const catImports = imports.filter(i => i.category === key);
    return {
      key,
      name: CATEGORY_LABELS[key],
      emissions: Number(catImports.reduce((s, i) => s + (i.embedded_emissions || 0), 0).toFixed(2)),
      charge: Number(catImports.reduce((s, i) => s + (i.cbam_charge_eur || 0), 0).toFixed(2)),
      color: CATEGORY_COLORS[key]
    };
  }).filter(d => d.emissions > 0 || d.charge > 0);

  const KPICard = ({ title, value, subtitle, icon: Icon, trend }) => (
    <div className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </div>
      {trend && (
        <p className={`text-xs mt-2 font-medium ${trend < 0 ? "text-green-600" : "text-red-500"}`}>
          {trend > 0 ? "+" : ""}{trend}% vs last quarter
        </p>
      )}
    </div>
  );

  const scopeData = [
    { name: 'Scope 1', value: scope1, color: '#f97316' },
    { name: 'Scope 2', value: scope2, color: '#3b82f6' },
    { name: 'Scope 3', value: Math.max(0, totalEmissions - scope1 - scope2), color: '#10b981' },
  ].filter(d => d.value > 0);

  const trendMap = activities.reduce((acc, a) => {
    const dateStr = a.activity_date || a.created_date;
    if (!dateStr) return acc;
    try {
      const d = new Date(dateStr);
      const month = format(d, "MMM yyyy");
      if (!acc[month]) acc[month] = { emissions: 0, sortDate: new Date(d.getFullYear(), d.getMonth(), 1).getTime() };
      acc[month].emissions += (a.co2e_kg || 0) / 1000;
    } catch (e) {}
    return acc;
  }, {});

  const trendData = Object.keys(trendMap).map(k => ({
    month: k,
    sortDate: trendMap[k].sortDate,
    emissions: Number(trendMap[k].emissions.toFixed(2))
  })).sort((a, b) => a.sortDate - b.sortDate);

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {org ? `Welcome back` : "Dashboard"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {org ? `${org.name} — Carbon footprint overview` : "Your carbon accounting overview"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to={createPageUrl("Emissions")}>
            <button className="inline-flex items-center px-3 py-2 border border-border rounded-lg text-xs font-medium hover:bg-muted transition-colors">
              <Activity className="w-3.5 h-3.5 mr-1.5" /> Log Activity
            </button>
          </Link>
          <Link to={createPageUrl("CBAMManager")}>
            <button className="inline-flex items-center px-3 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors">
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5" /> CBAM Import
            </button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Emissions" value={`${totalEmissions.toFixed(1)} tCO₂e`} subtitle={`${activities.length} activities logged`} icon={Flame} trend={-5.2} />
        <KPICard title="Scope 1" value={`${scope1.toFixed(1)} tCO₂e`} subtitle="Direct emissions" icon={Zap} trend={-3.1} />
        <KPICard title="Scope 2" value={`${scope2.toFixed(1)} tCO₂e`} subtitle="Indirect (energy)" icon={Activity} trend={-8.4} />
        <KPICard title="CBAM Liability" value={`€${totalCBAMCharge.toLocaleString()}`} subtitle={`${imports.length} imports tracked`} icon={ShieldCheck} trend={12.6} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 lg:col-span-2 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground mb-4 opacity-90">Emissions Trend (tCO₂e)</h3>
          <div className="h-[280px] w-full">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEmissions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => val.toFixed(1)} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }}
                    itemStyle={{ color: "hsl(var(--foreground))" }}
                    labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                  />
                  <Area type="monotone" dataKey="emissions" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorEmissions)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
                No activity data available
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground mb-4 opacity-90">Emissions by Scope</h3>
          <div className="h-[280px] w-full flex items-center justify-center">
            {scopeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={scopeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {scopeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `${value.toFixed(1)} tCO₂e`}
                    contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))", padding: "10px" }}
                    itemStyle={{ paddingBottom: "0px" }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: "12px", color: "hsl(var(--foreground))" }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
                No emission data yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CBAM Analytics Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <h2 className="text-lg font-bold text-foreground">CBAM Analytics</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* CBAM Liability by Category */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-4 opacity-90">Liability by Category (€)</h3>
            <div className="h-[300px] w-full flex items-center justify-center">
              {cbamCategoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={cbamCategoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="charge"
                    >
                      {cbamCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => `€${Number(value).toLocaleString()}`}
                      contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                  No CBAM import data to visualize
                </div>
              )}
            </div>
          </div>

          {/* Embedded Emissions by Category */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm text-xs font-semibold">
           <h3 className="text-sm font-semibold text-foreground mb-4 opacity-90">Embedded Emissions by Category</h3>
            <div className="h-[300px] w-full">
              {cbamCategoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cbamCategoryData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} width={80} />
                    <Tooltip
                      formatter={(value) => `${value.toFixed(1)} tCO₂e`}
                      contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }}
                    />
                    <Bar dataKey="emissions" radius={[0, 4, 4, 0]} barSize={20}>
                      {cbamCategoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                  No CBAM emissions data to visualize
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { to: "Reports", title: "Generate Reports", desc: "SECR & CBAM declarations" },
          { to: "AIInsights", title: "AI Insights", desc: "Reduction recommendations" },
          { to: "Onboarding", title: "Setup Guide", desc: "Complete your profile" },
        ].map((item) => (
          <Link key={item.to} to={createPageUrl(item.to)} className="group">
            <div className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-all duration-300 hover:border-primary/30 cursor-pointer h-full flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
