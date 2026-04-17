import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils/routes";
import {
  Activity, ShieldCheck, Flame, Factory, Plug, ArrowRight, LayoutDashboard,
  PoundSterling,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar,
} from "recharts";
import { format } from "date-fns";
import ThresholdMeter from "@/components/cbam/ThresholdMeter";
import DeadlineCountdown from "@/components/cbam/DeadlineCountdown";
import KPICard from "@/components/ui/KPICard";
import { useDashboard } from "@/hooks/useDashboard";

const SECTOR_COLORS = {
  steel: "#64748b",
  aluminium: "#94a3b8",
  cement: "#8b5cf6",
  fertiliser: "#059669",
  hydrogen: "#06b6d4",
};

export default function Dashboard() {
  const {
    org,
    activities,
    cbamSummary,
    threshold,
    etsPrice,
    totalEmissions,
    scope1,
    scope2,
    trendTotal,
    trendData,
    scopeData,
  } = useDashboard();

  
  const sectorChartData = (cbamSummary?.by_sector || []).map(s => ({
    name: s.sector.charAt(0).toUpperCase() + s.sector.slice(1),
    liability: s.liability_gbp,
    emissions: s.emissions_tco2e,
    color: SECTOR_COLORS[s.sector] || "#94a3b8",
  }));

  
  const cbamTimelineData = (cbamSummary?.monthly_timeline || []).map(m => ({
    month: format(new Date(m.year, m.month - 1), "MMM yy"),
    liability: m.liability_gbp,
    emissions: m.emissions_tco2e,
    count: m.count,
  }));

  
  const gbp = (val) => `£${parseFloat(val || 0).toLocaleString("en-GB", { minimumFractionDigits: 2 })}`;

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {org ? `Welcome back` : "Dashboard"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {org ? `${org.name} — Carbon footprint overview` : "Your carbon accounting overview"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={createPageUrl("Emissions")}>
            <button className="inline-flex items-center px-3 py-2 border border-border rounded-lg text-xs font-medium hover:bg-muted transition-colors">
              <Activity className="w-3.5 h-3.5 mr-1.5" /> Log Activity
            </button>
          </Link>
          <Link to={createPageUrl("CBAMManager")}>
            <button className="inline-flex items-center px-3 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors">
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5" /> UK CBAM
            </button>
          </Link>
        </div>
      </div>

      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Emissions"
          value={<>{totalEmissions.toFixed(1)} <span className="text-sm font-normal">tCO₂e</span></>}
          subtitle={`${activities.length} activities logged`}
          icon={Flame}
          trend={trendTotal}
        />
        <KPICard
          title="Scope 1 (Direct)"
          value={<>{scope1.toFixed(1)} <span className="text-sm font-normal">tCO₂e</span></>}
          subtitle="Direct combustion"
          icon={Factory}
        />
        <KPICard
          title="Scope 2 (Energy)"
          value={<>{scope2.toFixed(1)} <span className="text-sm font-normal">tCO₂e</span></>}
          subtitle="Purchased electricity"
          icon={Plug}
        />
        <KPICard
          title="UK CBAM Liability"
          value={gbp(cbamSummary?.total_liability_gbp || 0)}
          subtitle={`${cbamSummary?.total_imports || 0} imports tracked`}
          icon={PoundSterling}
          iconBg="bg-emerald-50"
        />
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
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0} />
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
                  <Area type="monotone" dataKey="emissions" stroke="#059669" strokeWidth={2} fillOpacity={1} fill="url(#colorEmissions)" />
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
                  <Pie data={scopeData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {scopeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `${value.toFixed(1)} tCO₂e`}
                    contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }}
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

      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <h2 className="text-lg font-bold text-foreground">UK CBAM Analytics</h2>
          </div>
          {etsPrice && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              UK ETS: <span className="font-mono text-foreground">{gbp(etsPrice.price_gbp)}/tCO₂e</span>
              <span className="text-muted-foreground/60">({etsPrice.quarter})</span>
            </div>
          )}
        </div>

        
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Total Liability</p>
            <p className="text-xl font-bold text-foreground mt-1">{gbp(cbamSummary?.total_liability_gbp)}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Default Liability</p>
            <p className="text-xl font-bold text-amber-600 mt-1">{gbp(cbamSummary?.total_liability_default_gbp)}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Total Savings</p>
            <p className="text-xl font-bold text-emerald-600 mt-1">{gbp(cbamSummary?.total_saving_gbp)}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Embedded Emissions</p>
            <p className="text-xl font-bold text-foreground mt-1">
              {parseFloat(cbamSummary?.total_emissions_tco2e || 0).toFixed(1)} <span className="text-sm font-normal">tCO₂e</span>
            </p>
          </div>
        </div>

        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-4 opacity-90">Liability by Sector (£)</h3>
            <div className="h-[300px] w-full flex items-center justify-center">
              {sectorChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sectorChartData}
                      cx="50%" cy="50%"
                      innerRadius={70} outerRadius={90}
                      paddingAngle={4} dataKey="liability"
                    >
                      {sectorChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => `£${Number(value).toLocaleString("en-GB", { minimumFractionDigits: 2 })}`}
                      contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: "11px" }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                  No import data yet
                </div>
              )}
            </div>
          </div>

          
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-foreground mb-4 opacity-90">Monthly CBAM Liability (£)</h3>
            <div className="h-[300px] w-full">
              {cbamTimelineData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cbamTimelineData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false}
                      tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(value) => `£${Number(value).toLocaleString("en-GB", { minimumFractionDigits: 2 })}`}
                      contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", borderRadius: "8px" }}
                    />
                    <Bar dataKey="liability" radius={[4, 4, 0, 0]} barSize={30} fill="#059669" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
                  No monthly data yet
                </div>
              )}
            </div>
          </div>

          
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground mb-4 opacity-90">£50k Import Threshold</h3>
              {threshold ? (
                <ThresholdMeter
                  current_gbp={threshold.total_gbp}
                  threshold_gbp={threshold.threshold_gbp}
                />
              ) : (
                <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
                  Loading...
                </div>
              )}
            </div>

            <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
              <DeadlineCountdown />
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
