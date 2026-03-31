const db = globalThis.__B44_DB__;

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Plus, Download, Send, Trash2 } from "lucide-react";
import { format } from "date-fns";

const typeLabels = { secr: "SECR Report", cbam_declaration: "CBAM Declaration", executive_summary: "Executive Summary" };
const statusColors = { draft: "bg-gray-100 text-gray-600", generated: "bg-emerald-100 text-emerald-700", submitted: "bg-blue-100 text-blue-700", approved: "bg-green-100 text-green-700" };

export default function Reports() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", type: "secr", period: "" });
  const [generatingId, setGeneratingId] = useState(null);
  const queryClient = useQueryClient();

  const { data: reports = [] } = useQuery({ queryKey: ["reports"], queryFn: () => db.entities.Report.list("-created_date", 100) });
  const { data: activities = [] } = useQuery({ queryKey: ["emissions"], queryFn: () => db.entities.EmissionActivity.list("-created_date", 200) });
  const { data: imports = [] } = useQuery({ queryKey: ["cbam-imports"], queryFn: () => db.entities.CBAMImport.list("-created_date", 200) });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const totalEmissions = activities.reduce((s, a) => s + (a.co2e_kg || 0), 0) / 1000;
      const totalCBAM = imports.reduce((s, i) => s + (i.cbam_charge_eur || 0), 0);
      return db.entities.Report.create({ ...data, total_emissions_tco2e: parseFloat(totalEmissions.toFixed(2)), total_cbam_charge_eur: parseFloat(totalCBAM.toFixed(2)), status: "draft" });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["reports"] }); setShowCreate(false); setForm({ title: "", type: "secr", period: "" }); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => db.entities.Report.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reports"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => db.entities.Report.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reports"] }),
  });

  const handleGenerate = async (report) => {
    setGeneratingId(report.id);
    if (report.type === "executive_summary") {
      const totalTco2e = activities.reduce((s, a) => s + (a.co2e_kg || 0), 0) / 1000;
      const aiResult = await db.integrations.Core.InvokeLLM({
        prompt: `You are a carbon accounting expert. Generate 6 reduction recommendations based on total emissions of ${totalTco2e.toFixed(2)} tCO2e. Return JSON with a "recommendations" array.`,
        response_json_schema: { type: "object", properties: { recommendations: { type: "array", items: { type: "object" } } } }
      });
      await updateMutation.mutateAsync({ id: report.id, data: { status: "generated", notes: JSON.stringify(aiResult) } });
    } else {
      await updateMutation.mutateAsync({ id: report.id, data: { status: "generated" } });
    }
    setGeneratingId(null);
  };

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center"><FileText className="w-5 h-5 text-amber-600" /></div>
          <div><h1 className="text-xl font-bold text-foreground">Reports</h1><p className="text-xs text-muted-foreground">SECR reports & CBAM declarations</p></div>
        </div>
        <button onClick={() => setShowCreate(true)} className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"><Plus className="w-4 h-4 mr-1.5" /> New Report</button>
      </div>

      {showCreate && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-base font-semibold mb-4">Create Report</h3>
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className="text-xs font-medium text-muted-foreground">Title *</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm" required /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Type *</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm">
                  {Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select></div>
              <div><label className="text-xs font-medium text-muted-foreground">Period *</label><input value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm" placeholder="e.g. 2025-Q1" required /></div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">Create</button>
            </div>
          </form>
        </div>
      )}

      {reports.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground text-sm">No reports yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((r) => (
            <div key={r.id} className="bg-card border border-border rounded-xl p-5 space-y-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div><h3 className="text-sm font-semibold text-foreground">{r.title}</h3><p className="text-xs text-muted-foreground mt-0.5">{typeLabels[r.type] || r.type} · {r.period}</p></div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${statusColors[r.status] || ""}`}>{r.status}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div><p className="text-muted-foreground">Emissions</p><p className="font-semibold">{r.total_emissions_tco2e?.toFixed(1) || 0} tCO₂e</p></div>
                <div><p className="text-muted-foreground">CBAM Charges</p><p className="font-semibold">€{r.total_cbam_charge_eur?.toLocaleString() || 0}</p></div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-[10px] text-muted-foreground">{r.created_date ? format(new Date(r.created_date), "MMM d, yyyy") : ""}</span>
                <div className="flex gap-1">
                  {r.status === "draft" && (
                    <button onClick={() => handleGenerate(r)} disabled={generatingId === r.id} className="px-2 py-1 border border-border rounded text-xs hover:bg-muted disabled:opacity-50">
                      <Download className="w-3 h-3 inline mr-1" />{generatingId === r.id ? "..." : "Generate"}
                    </button>
                  )}
                  {r.status === "generated" && (
                    <button onClick={() => updateMutation.mutate({ id: r.id, data: { status: "submitted" } })} className="px-2 py-1 border border-border rounded text-xs hover:bg-muted">
                      <Send className="w-3 h-3 inline mr-1" /> Submit
                    </button>
                  )}
                  <button onClick={() => deleteMutation.mutate(r.id)} className="p-1 hover:bg-destructive/10 rounded"><Trash2 className="w-3 h-3 text-destructive" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
