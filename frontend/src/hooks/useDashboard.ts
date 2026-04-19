import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { cbamApi } from "@/services/cbamApiService";
import { httpFetch } from "@/services/httpClient";
import { organizationService } from "@/services/organizationService";

// ─── helpers (pure, stable references) ───────────────────────────────────────
const inRange = (item: any, start: Date, end: Date) => {
  const d = new Date(item.activity_date || item.created_date);
  return d >= start && d <= end;
};

const pctChange = (cur: number, prev: number): number | null => {
  if (prev === 0) return null;
  return Number(((cur - prev) / prev * 100).toFixed(1));
};

// ─── hook ────────────────────────────────────────────────────────────────────
export function useDashboard() {
  const [org, setOrg] = useState<any>(null);

  // Activities — use httpFetch (shared auth client) instead of raw fetch + localStorage
  const { data: activitiesData = {} } = useQuery({
    queryKey: ["emissions-dashboard"],
    queryFn: () =>
      httpFetch("/api/v1/emission-activities?page=1&page_size=1000&order_by=-created_date"),
  });
  const activities: any[] = (activitiesData as any)?.items || [];

  // Organisation
  const { data: orgs = [] } = useQuery({
    queryKey: ["orgs"],
    queryFn: () => organizationService.listOrganizations("-created_date", 1),
  });

  useEffect(() => {
    if ((orgs as any[]).length > 0) setOrg((orgs as any[])[0]);
  }, [(orgs as any[]).length]); // depend on length, not array ref — prevents infinite re-fire

  // CBAM data
  const { data: cbamSummary } = useQuery({
    queryKey: ["cbam-dashboard-summary"],
    queryFn: () => httpFetch("/api/dashboard/cbam-summary"),
    staleTime: 30_000,
  });

  const { data: threshold } = useQuery({
    queryKey: ["threshold-status"],
    queryFn: () => cbamApi.getThresholdStatus(),
    staleTime: 30_000,
  });

  const { data: etsPrice } = useQuery({
    queryKey: ["ets-price-current"],
    queryFn: () => cbamApi.getCurrentETSPrice(),
    staleTime: 5 * 60_000,
  });

  // ─── derived values (useMemo-style inline, pure) ──────────────────────────
  const totalEmissions = activities.reduce((s, a) => s + (a.co2e_kg || 0), 0) / 1000;
  const scope1 = activities.filter(a => a.scope === "scope_1").reduce((s, a) => s + (a.co2e_kg || 0), 0) / 1000;
  const scope2 = activities.filter(a => a.scope === "scope_2").reduce((s, a) => s + (a.co2e_kg || 0), 0) / 1000;

  const now = new Date();
  const curQStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  const prevQStart = new Date(curQStart);
  prevQStart.setMonth(prevQStart.getMonth() - 3);
  const prevQEnd = new Date(curQStart);
  prevQEnd.setMilliseconds(-1);

  const curAct = activities.filter(a => inRange(a, curQStart, now));
  const prevAct = activities.filter(a => inRange(a, prevQStart, prevQEnd));
  const curTotal = curAct.reduce((s, a) => s + (a.co2e_kg || 0), 0) / 1000;
  const prevTotal = prevAct.reduce((s, a) => s + (a.co2e_kg || 0), 0) / 1000;
  const trendTotal = pctChange(curTotal, prevTotal);

  // Monthly trend chart data
  const trendMap = activities.reduce((acc: any, a) => {
    const dateStr = a.activity_date || a.created_date;
    if (!dateStr) return acc;
    try {
      const d = new Date(dateStr);
      const month = format(d, "MMM yyyy");
      if (!acc[month]) acc[month] = { emissions: 0, sortDate: new Date(d.getFullYear(), d.getMonth(), 1).getTime() };
      acc[month].emissions += (a.co2e_kg || 0) / 1000;
    } catch (_) { /* invalid date — skip */ }
    return acc;
  }, {});

  const trendData = Object.keys(trendMap)
    .map(k => ({ month: k, sortDate: trendMap[k].sortDate, emissions: Number(trendMap[k].emissions.toFixed(2)) }))
    .sort((a, b) => a.sortDate - b.sortDate);

  // Scope breakdown for pie chart
  const scopeData = [
    { name: "Scope 1", value: scope1, color: "#f97316" },
    { name: "Scope 2", value: scope2, color: "#3b82f6" },
    { name: "Scope 3", value: Math.max(0, totalEmissions - scope1 - scope2), color: "#059669" },
  ].filter(d => d.value > 0);

  return {
    org,
    activities,          // raw list — used for activity count in KPI cards
    cbamSummary,
    threshold,
    etsPrice,
    totalEmissions,
    scope1,
    scope2,
    trendTotal,
    trendData,
    scopeData,
  };
}
