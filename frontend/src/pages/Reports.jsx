import React, { useState, useMemo, useCallback } from "react";
import {
  FileText, Plus, Download, Send, Trash2, FileSpreadsheet,
  Calendar, Filter, ChevronDown, X, Loader2, Eye, ChevronLeft, ChevronRight,
} from "lucide-react";

import { format, subMonths, startOfMonth } from "date-fns";
import { toast } from "sonner";
import Select from "@/components/ui/Select";
import {
  useReports, useGenerateReport, useUpdateReport,
  useDeleteReport,
} from "@/hooks/useReports";
import { reportService } from "@/services/reportService";

const TYPE_LABELS = {
  secr: "SECR Report",
  cbam_declaration: "CBAM Declaration",
  executive_summary: "Executive Summary",
};
const STATUS_STYLES = {
  draft: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  generated: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  submitted: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  approved: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
};

const PERIOD_PRESETS = [
  { label: "1M", months: 1 },
  { label: "3M", months: 3 },
  { label: "6M", months: 6 },
  { label: "12M", months: 12 },
  { label: "All Time", months: 0 },
];

function formatPeriodLabel(months) {
  if (months === 0) return "All Time";
  const end = new Date();
  const start = startOfMonth(subMonths(end, months));
  return `${format(start, "MMM yyyy")} – ${format(end, "MMM yyyy")}`;
}

function computeDateRange(months) {
  if (months === 0) return { start: null, end: null };
  const end = new Date();
  const start = startOfMonth(subMonths(end, months));
  return {
    start: format(start, "yyyy-MM-dd"),
    end: format(end, "yyyy-MM-dd"),
  };
}

export default function Reports() {
  
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", type: "secr", period: "" });
  const [selectedPreset, setSelectedPreset] = useState(0); 
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [downloadingId, setDownloadingId] = useState(null);
  const [exportingId, setExportingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  
  const { data: reportsData, isLoading } = useReports(currentPage, 3);
  const reports = reportsData?.items || [];
  const pagination = {
    page: reportsData?.page || 1,
    total: reportsData?.total || 0,
    totalPages: reportsData?.total_pages || 1,
    hasNext: reportsData?.has_next || false,
    hasPrev: reportsData?.has_prev || false,
  };
  
  const generateMutation = useGenerateReport();
  const updateMutation = useUpdateReport();
  const deleteMutation = useDeleteReport();

  
  const dateRange = useMemo(() => {
    if (customStart && customEnd) {
      return { start: customStart, end: customEnd };
    }
    const preset = PERIOD_PRESETS[selectedPreset];
    return computeDateRange(preset?.months || 0);
  }, [selectedPreset, customStart, customEnd]);

  
  const filteredReports = useMemo(() => {
    let filtered = reports;
    if (typeFilter !== "all") {
      filtered = filtered.filter((r) => r.type === typeFilter);
    }
    return filtered;
  }, [reports, typeFilter]);

  
  const handleCreate = useCallback(async (e) => {
    e.preventDefault();
    const periodLabel = customStart && customEnd
      ? `${format(new Date(customStart), "MMM yyyy")} – ${format(new Date(customEnd), "MMM yyyy")}`
      : formatPeriodLabel(PERIOD_PRESETS[selectedPreset]?.months || 0);

    await generateMutation.mutateAsync({
      title: form.title,
      type: form.type,
      period: form.period || periodLabel,
      start_date: dateRange.start || undefined,
      end_date: dateRange.end || undefined,
    });
    setShowCreate(false);
    setForm({ title: "", type: "secr", period: "" });
    setCurrentPage(1); 
  }, [form, dateRange, selectedPreset, customStart, customEnd, generateMutation]);

  const handleDownloadPdf = useCallback(async (report) => {
    setDownloadingId(report.id);
    try {
      await reportService.downloadReportPdf(report);
    } catch (err) {
      console.error("PDF download failed:", err);
      alert(`PDF generation failed: ${err.message || "Unknown error"}`);
    } finally {
      setDownloadingId(null);
    }
  }, []);


  const handleExport = useCallback(async (report, exportType) => {
    setExportingId(report.id);
    try {
      const [data, exportUtils] = await Promise.all([
        reportService.getReportData(report.id),
        import("@/utils/reportExportUtils"),
      ]);
      const meta = { title: report.title, type: TYPE_LABELS[report.type] || report.type, period: report.period };
      if (exportType === "csv") {
        exportUtils.exportToCSV(data, meta);
      } else {
        exportUtils.exportToXLS(data, meta);
      }
    } catch (err) {
      toast.error("Export failed. Please try again.");
    }
    setExportingId(null);
  }, []);

  const handleSubmit = useCallback((report) => {
    updateMutation.mutate({ id: report.id, data: { status: "submitted" } });
  }, [updateMutation]);

  const handleDelete = useCallback((report) => {
    if (window.confirm(`Delete "${report.title}"?`)) {
      deleteMutation.mutate(report.id);
    }
  }, [deleteMutation]);

  const handlePresetClick = useCallback((idx) => {
    setSelectedPreset(idx);
    setCustomStart("");
    setCustomEnd("");
  }, []);

  
  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 overflow-auto">
        <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Reports</h1>
            <p className="text-xs text-muted-foreground">SECR reports & CBAM declarations</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" /> New Report
        </button>
      </div>

      
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        
        <div className="flex flex-wrap items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground mr-1">Period:</span>
          {PERIOD_PRESETS.map((p, i) => (
            <button
              key={p.label}
              onClick={() => handlePresetClick(i)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedPreset === i && !customStart
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              {p.label}
            </button>
          ))}

          <div className="flex items-center gap-1.5 ml-2">
            <input
              type="date"
              value={customStart}
              onChange={(e) => { setCustomStart(e.target.value); setSelectedPreset(-1); }}
              className="px-2 py-1.5 border border-border rounded-lg text-xs bg-background text-foreground"
            />
            <span className="text-xs text-muted-foreground">→</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => { setCustomEnd(e.target.value); setSelectedPreset(-1); }}
              className="px-2 py-1.5 border border-border rounded-lg text-xs bg-background text-foreground"
            />
            {customStart && (
              <button
                onClick={() => { setCustomStart(""); setCustomEnd(""); setSelectedPreset(4); }}
                className="p-1 hover:bg-muted rounded"
              >
                <X className="w-3 h-3 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground mr-1">Type:</span>
          {[
            { value: "all", label: "All Reports" },
            { value: "secr", label: "SECR" },
            { value: "cbam_declaration", label: "CBAM" },
            { value: "executive_summary", label: "Executive" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setTypeFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                typeFilter === f.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      
      {showCreate && (
        <div className="bg-card border border-border rounded-xl p-6 shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-foreground">Create Report</h3>
            <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-muted rounded-lg">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Title *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  placeholder="e.g. FY2025 SECR Report"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Type *</label>
                <Select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="mt-1"
                >
                  {Object.entries(TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Period Label</label>
                <input
                  value={form.period}
                  onChange={(e) => setForm({ ...form, period: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                  placeholder={customStart ? `${customStart} to ${customEnd}` : "Auto-filled from filter"}
                />
              </div>
            </div>

            <div className="bg-muted/30 border border-border rounded-lg p-3">
              <p className="text-xs text-muted-foreground">
                <Eye className="w-3 h-3 inline mr-1" />
                Report will aggregate data for: <strong>
                  {customStart && customEnd
                    ? `${format(new Date(customStart), "d MMM yyyy")} → ${format(new Date(customEnd), "d MMM yyyy")}`
                    : selectedPreset >= 0 && PERIOD_PRESETS[selectedPreset]
                      ? PERIOD_PRESETS[selectedPreset].months === 0
                        ? "All Time"
                        : formatPeriodLabel(PERIOD_PRESETS[selectedPreset].months)
                      : "All Time"
                  }
                </strong>
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={generateMutation.isPending}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 inline-flex items-center"
              >
                {generateMutation.isPending && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
                Generate Report
              </button>
            </div>
          </form>
        </div>
      )}

      
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading reports…
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {reports.length === 0
              ? "No reports yet. Click \"New Report\" to get started."
              : "No reports match the current filters."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReports.map((r) => (
            <ReportCard
              key={r.id}
              report={r}
              downloadingId={downloadingId}
              exportingId={exportingId}
              onDownloadPdf={handleDownloadPdf}
              onExport={handleExport}
              onSubmit={handleSubmit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
        </div>
      </div>

      
      {!showCreate && pagination.totalPages > 1 && (
        <div className="bg-background">
          <div className="p-3 lg:p-4 max-w-[1400px] mx-auto">
            <div className="bg-card border border-border rounded-xl px-4 py-2">
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  Showing {filteredReports.length > 0 ? ((pagination.page - 1) * 3 + 1) : 0} to {Math.min(pagination.page * 3, pagination.total)} of {pagination.total} reports
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => p - 1)}
                    disabled={!pagination.hasPrev}
                    className="inline-flex items-center px-3 py-1.5 border border-border rounded-lg text-xs font-medium hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-background"
                  >
                    <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Previous
                  </button>
                  <span className="text-xs font-medium text-muted-foreground px-2">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => p + 1)}
                    disabled={!pagination.hasNext}
                    className="inline-flex items-center px-3 py-1.5 border border-border rounded-lg text-xs font-medium hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-background"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



function ReportCard({ report: r, downloadingId, exportingId, onDownloadPdf, onExport, onSubmit, onDelete }) {
  const [showExportMenu, setShowExportMenu] = useState(false);

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3 hover:shadow-md transition-all duration-200 group">
      
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-foreground truncate">{r.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {TYPE_LABELS[r.type] || r.type} · {r.period}
          </p>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ml-2 whitespace-nowrap ${STATUS_STYLES[r.status] || ""}`}>
          {r.status}
        </span>
      </div>

      
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-muted/30 rounded-lg p-2">
          <p className="text-muted-foreground text-[10px] uppercase tracking-wide">Emissions</p>
          <p className="font-bold text-foreground mt-0.5">
            {r.total_emissions_tco2e?.toFixed(1) || "0.0"} <span className="text-muted-foreground font-normal">tCO₂e</span>
          </p>
        </div>
        <div className="bg-muted/30 rounded-lg p-2">
          <p className="text-muted-foreground text-[10px] uppercase tracking-wide">CBAM Charges</p>
          <p className="font-bold text-foreground mt-0.5">
            €{r.total_cbam_charge_eur?.toLocaleString() || "0"}
          </p>
        </div>
      </div>

      
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <span className="text-[10px] text-muted-foreground">
          {r.created_date ? format(new Date(r.created_date), "MMM d, yyyy") : ""}
        </span>
        <div className="flex items-center gap-1">
          
          {(r.status === "generated" || r.status === "submitted") && (
            <button
              onClick={() => onDownloadPdf(r)}
              disabled={downloadingId === r.id}
              className="inline-flex items-center px-2 py-1 border border-border rounded-md text-xs hover:bg-muted transition-colors disabled:opacity-50"
              title="Download PDF"
            >
              {downloadingId === r.id ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <>
                  <Download className="w-3 h-3 mr-1" /> PDF
                </>
              )}
            </button>
          )}

          
          {(r.status === "generated" || r.status === "submitted") && (
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={exportingId === r.id}
                className="inline-flex items-center px-2 py-1 border border-border rounded-md text-xs hover:bg-muted transition-colors disabled:opacity-50"
                title="Export data"
              >
                {exportingId === r.id ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <>
                    <FileSpreadsheet className="w-3 h-3 mr-1" />
                    <ChevronDown className="w-2.5 h-2.5" />
                  </>
                )}
              </button>
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-20 py-1 min-w-[100px]">
                  <button
                    onClick={() => { onExport(r, "csv"); setShowExportMenu(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors"
                  >
                    CSV
                  </button>
                  <button
                    onClick={() => { onExport(r, "xlsx"); setShowExportMenu(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors"
                  >
                    Excel (XLSX)
                  </button>
                </div>
              )}
            </div>
          )}

          
          {r.status === "generated" && (
            <button
              onClick={() => onSubmit(r)}
              className="inline-flex items-center px-2 py-1 border border-primary/30 text-primary rounded-md text-xs hover:bg-primary/10 transition-colors"
              title="Mark as submitted"
            >
              <Send className="w-3 h-3 mr-1" /> Submit
            </button>
          )}

          
          <button
            onClick={() => onDelete(r)}
            className="p-1.5 hover:bg-destructive/10 rounded-md transition-colors"
            title="Delete report"
          >
            <Trash2 className="w-3 h-3 text-destructive" />
          </button>
        </div>
      </div>
    </div>
  );
}
