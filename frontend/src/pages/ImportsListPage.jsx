/**
 * ImportsListPage — /CBAMManager (replaces old EU CBAMManager)
 * Paginated table with filters by year and sector.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Plus, Search, ChevronLeft, ChevronRight, Package, Filter, ArrowUpDown } from "lucide-react";
import { cbamApi } from "@/services/cbamApiService";
import DataSourceBadge from "@/components/cbam/DataSourceBadge";

function gbp(val) {
  const n = parseFloat(val || 0);
  return `£${n.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`;
}

const SECTORS = ["", "aluminium", "cement", "fertiliser", "hydrogen", "steel"];
const YEARS = [2027, 2028, 2029];

export default function ImportsListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [year, setYear] = useState(null);
  const [sector, setSector] = useState("");
  const pageSize = 20;

  const { data, isLoading, error } = useQuery({
    queryKey: ["cbam-imports", page, year, sector],
    queryFn: () => cbamApi.listImports({ page, page_size: pageSize, year, sector: sector || undefined }),
  });

  const { data: etsPrice } = useQuery({
    queryKey: ["ets-price-current"],
    queryFn: () => cbamApi.getCurrentETSPrice(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: threshold } = useQuery({
    queryKey: ["threshold-status"],
    queryFn: () => cbamApi.getThresholdStatus(),
    staleTime: 30 * 1000,
  });

  const items = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  const totalLiability = items.reduce((sum, i) => sum + parseFloat(i.cbam_liability_gbp || 0), 0);
  const totalSaving = items.reduce((sum, i) => sum + parseFloat(i.potential_saving_gbp || 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">UK CBAM Imports</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your Carbon Border Adjustment Mechanism import records</p>
        </div>
        <button
          onClick={() => navigate("/AddImport")}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" />
          Add Import
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card shadow-sm border border-border rounded-xl p-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Total Imports</p>
          <p className="text-2xl font-bold text-foreground mt-1">{total}</p>
        </div>
        <div className="bg-card shadow-sm border border-border rounded-xl p-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">CBAM Liability (page)</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{gbp(totalLiability)}</p>
        </div>
        <div className="bg-card shadow-sm border border-border rounded-xl p-4">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Savings vs Default</p>
          <p className="text-2xl font-bold text-green-400 mt-1">{gbp(totalSaving)}</p>
        </div>
        <div className={`border rounded-xl p-4 ${
          threshold?.status === "exceeded" ? "bg-red-500/10 border-red-500/20" :
          threshold?.status === "warning" ? "bg-amber-500/10 border-amber-500/20" :
          "bg-card shadow-sm border-border"
        }`}>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">£50k Threshold</p>
          <p className={`text-2xl font-bold mt-1 ${
            threshold?.status === "exceeded" ? "text-red-400" :
            threshold?.status === "warning" ? "text-amber-400" :
            "text-emerald-400"
          }`}>{threshold ? `${threshold.percentage}%` : "—"}</p>
          <p className="text-[10px] text-muted-foreground/70 mt-0.5">
            {threshold ? `${gbp(threshold.total_gbp)} / ${gbp(threshold.threshold_gbp)}` : ""}
          </p>
        </div>
      </div>

      {/* Current UK ETS Rate */}
      {etsPrice && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          UK ETS Rate: <span className="text-foreground/70 font-mono">{gbp(etsPrice.price_gbp)}/tCO₂e</span>
          <span className="text-muted-foreground/50">({etsPrice.quarter})</span>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-muted-foreground/70" />
        <select
          value={year || ""}
          onChange={(e) => { setYear(e.target.value ? Number(e.target.value) : null); setPage(1); }}
          className="px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-emerald-500/40"
        >
          <option value="">All Years</option>
          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select
          value={sector}
          onChange={(e) => { setSector(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-emerald-500/40"
        >
          <option value="">All Sectors</option>
          {SECTORS.filter(Boolean).map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-border border-t-emerald-400 rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground/70 mt-3">Loading imports...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-red-400 text-sm">Failed to load imports</div>
        ) : items.length === 0 ? (
          <div className="p-16 text-center">
            <Package className="w-12 h-12 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground mt-4">No imports found</p>
            <button onClick={() => navigate("/AddImport")} className="mt-4 px-5 py-2 bg-emerald-500 text-white rounded-lg text-sm font-semibold hover:bg-emerald-400 transition-colors">
              Add your first import
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-[11px] uppercase tracking-wider">
                <th className="text-left p-3 pl-4">Date</th>
                <th className="text-left p-3">Origin</th>
                <th className="text-left p-3">Product</th>
                <th className="text-right p-3">Qty (t)</th>
                <th className="text-right p-3">Liability</th>
                <th className="text-right p-3">Saving</th>
                <th className="text-center p-3">Data Source</th>
                <th className="text-left p-3">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {items.map((imp) => (
                <tr
                  key={imp.id}
                  onClick={() => navigate(`/ImportDetail/${imp.id}`)}
                  className="hover:bg-card shadow-sm cursor-pointer transition-colors"
                >
                  <td className="p-3 pl-4 font-mono text-foreground/80">{imp.import_date}</td>
                  <td className="p-3 text-foreground/70">{imp.country_of_origin}</td>
                  <td className="p-3 text-muted-foreground max-w-[200px] truncate">{imp.emissions_intensity_default} tCO₂e/t</td>
                  <td className="p-3 text-right font-mono text-foreground/80">{parseFloat(imp.quantity_tonnes).toLocaleString()}</td>
                  <td className={`p-3 text-right font-mono font-semibold ${imp.is_threshold_exempt ? 'text-blue-400' : 'text-emerald-400'}`}>
                    {imp.is_threshold_exempt ? "Exempt" : gbp(imp.cbam_liability_gbp)}
                  </td>
                  <td className="p-3 text-right font-mono text-green-400">
                    {parseFloat(imp.potential_saving_gbp || 0) > 0 ? `+${gbp(imp.potential_saving_gbp)}` : "—"}
                  </td>
                  <td className="p-3 text-center">
                    <DataSourceBadge source={imp.data_source} />
                  </td>
                  <td className="p-3 text-muted-foreground capitalize">{imp.import_type.replace("_", " ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {page} of {totalPages} ({total} imports)</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}
              className="p-2 rounded-lg bg-background border border-border disabled:opacity-30 hover:bg-muted transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}
              className="p-2 rounded-lg bg-background border border-border disabled:opacity-30 hover:bg-muted transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
