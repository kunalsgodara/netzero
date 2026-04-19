
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Edit3, Trash2, Clock, User, ArrowUpDown, Save, X } from "lucide-react";
import { cbamApi } from "@/services/cbamApiService";
import FormulaBreakdown from "@/components/cbam/FormulaBreakdown";
import DataSourceBadge from "@/components/cbam/DataSourceBadge";

function gbp(val) {
  const n = parseFloat(val || 0);
  return `£${n.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`;
}

function formatDate(iso) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

export default function ImportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  const { data: imp, isLoading, error } = useQuery({
    queryKey: ["cbam-import", id],
    queryFn: () => cbamApi.getImport(id),
    enabled: !!id,
  });

  const { data: auditEntries } = useQuery({
    queryKey: ["cbam-import-audit", id],
    queryFn: () => cbamApi.getImportAudit(id),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => cbamApi.updateImport(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cbam-import", id] });
      queryClient.invalidateQueries({ queryKey: ["cbam-import-audit", id] });
      queryClient.invalidateQueries({ queryKey: ["cbam-imports"] });
      setEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => cbamApi.deleteImport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cbam-imports"] });
      navigate("/CBAMManager");
    },
  });

  const startEdit = () => {
    setEditForm({
      quantity_tonnes: imp.quantity_tonnes,
      import_value_gbp: imp.import_value_gbp,
      country_of_origin: imp.country_of_origin,
      carbon_price_deduction_gbp: imp.carbon_price_deduction_gbp,
    });
    setEditing(true);
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-border border-t-emerald-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !imp) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-400">Import not found</p>
        <button onClick={() => navigate("/CBAMManager")} className="mt-4 text-sm text-emerald-400 hover:underline">← Back to imports</button>
      </div>
    );
  }

  const intensity = imp.data_source !== "default" && imp.emissions_intensity_actual
    ? imp.emissions_intensity_actual
    : imp.emissions_intensity_default;

  return (
    <div className="p-4 max-w-5xl mx-auto space-y-4">
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/CBAMManager")} className="p-2 rounded-lg bg-background hover:bg-muted transition-colors">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Import Detail</h1>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">{imp.id.slice(0, 8)}…</p>
          </div>
        </div>
        <div className="flex gap-2">
          {!editing && (
            <>
              <button onClick={startEdit} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background border border-border text-sm text-foreground/70 hover:bg-muted transition-colors">
                <Edit3 className="w-3.5 h-3.5" /> Edit
              </button>
              <button onClick={() => { if (confirm("Delete this import?")) deleteMutation.mutate(); }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 hover:bg-red-500/20 transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        <div className="space-y-4">
          <div className="bg-card shadow-sm rounded-xl border border-border p-4 space-y-3">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Import Information</h3>

            {editing ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground">Quantity (tonnes)</label>
                  <input type="number" step="0.01" value={editForm.quantity_tonnes}
                    onChange={(e) => setEditForm({ ...editForm, quantity_tonnes: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-emerald-500/40" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Import Value (£ GBP)</label>
                  <input type="number" step="0.01" value={editForm.import_value_gbp}
                    onChange={(e) => setEditForm({ ...editForm, import_value_gbp: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-emerald-500/40" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Deduction (£)</label>
                  <input type="number" step="0.01" value={editForm.carbon_price_deduction_gbp}
                    onChange={(e) => setEditForm({ ...editForm, carbon_price_deduction_gbp: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-emerald-500/40" />
                </div>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => updateMutation.mutate(editForm)} disabled={updateMutation.isPending}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-semibold hover:bg-emerald-400 transition-colors disabled:opacity-50">
                    <Save className="w-3.5 h-3.5" /> Save
                  </button>
                  <button onClick={() => setEditing(false)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-background text-muted-foreground rounded-lg text-sm hover:bg-muted transition-colors">
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                {[
                  ["Date", imp.import_date],
                  ["Country", imp.country_of_origin],
                  ["Type", imp.import_type.replace("_", " ")],
                  ["Quantity", `${parseFloat(imp.quantity_tonnes).toLocaleString()} tonnes`],
                  ["Import Value", gbp(imp.import_value_gbp)],
                  ["Deduction", gbp(imp.carbon_price_deduction_gbp)],
                  ["Default Intensity", `${imp.emissions_intensity_default} tCO₂e/t`],
                  ...(imp.emissions_intensity_actual ? [["Actual Intensity", `${imp.emissions_intensity_actual} tCO₂e/t`]] : []),
                  ...(imp.verifier_name ? [["Verifier", imp.verifier_name]] : []),
                  ["UK ETS Rate", `${gbp(imp.uk_ets_rate_used)}/tCO₂e`],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="text-foreground font-medium capitalize">{value}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between text-sm pt-2">
                  <span className="text-muted-foreground">Data Source</span>
                  <DataSourceBadge source={imp.data_source} />
                </div>

                {/* Installation Fields */}
                {(imp.installation_name || imp.installation_id || imp.production_route) && (
                  <>
                    <div className="border-t border-border my-3" />
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                      Installation Details
                    </h4>
                    {imp.installation_name && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Installation Name</span>
                        <span className="text-foreground font-medium">{imp.installation_name}</span>
                      </div>
                    )}
                    {imp.installation_id && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Installation ID</span>
                        <span className="text-foreground font-medium font-mono">{imp.installation_id}</span>
                      </div>
                    )}
                    {imp.production_route && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Production Route</span>
                        <span className="text-foreground font-medium">{imp.production_route}</span>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>

        
        <div className="bg-card shadow-sm rounded-xl border border-border p-4">
          <FormulaBreakdown
            quantity_tonnes={imp.quantity_tonnes}
            emissions_intensity={intensity}
            emissions_intensity_default={imp.emissions_intensity_default}
            uk_ets_rate={imp.uk_ets_rate_used}
            carbon_price_deduction_gbp={imp.carbon_price_deduction_gbp}
            import_type={imp.import_type}
            data_source={imp.data_source}
            embedded_emissions_tco2e={imp.embedded_emissions_tco2e}
            cbam_liability_gbp={imp.cbam_liability_gbp}
            cbam_liability_default_gbp={imp.cbam_liability_default_gbp}
            potential_saving_gbp={imp.potential_saving_gbp}
            is_threshold_exempt={imp.is_threshold_exempt}
            exemption_reason={imp.exemption_reason}
          />
        </div>
      </div>

      
      <div className="bg-card shadow-sm rounded-xl border border-border p-4">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Audit Trail</h3>

        {!auditEntries || auditEntries.length === 0 ? (
          <p className="text-sm text-muted-foreground/70">No audit entries found</p>
        ) : (
          <div className="space-y-0">
            {auditEntries.map((entry, idx) => (
              <div key={entry.id} className="flex gap-4">
                
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                    entry.action === "created" ? "bg-emerald-400" :
                    entry.action === "updated" ? "bg-blue-400" :
                    entry.action === "deleted" ? "bg-red-400" :
                    "bg-card/20"
                  }`} />
                  {idx < auditEntries.length - 1 && <div className="w-px flex-1 bg-muted my-1" />}
                </div>
                
                <div className="pb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <span className={`font-semibold capitalize ${
                      entry.action === "created" ? "text-emerald-400" :
                      entry.action === "updated" ? "text-blue-400" :
                      entry.action === "deleted" ? "text-red-400" :
                      "text-muted-foreground"
                    }`}>{entry.action}</span>
                  </div>
                  <p className="text-xs text-muted-foreground/70 mt-0.5 flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {formatDate(entry.created_at)}
                  </p>
                  
                  {entry.action === "updated" && entry.old_data && entry.new_data && (
                    <div className="mt-2 space-y-1">
                      {Object.keys(entry.new_data).filter(k => entry.old_data[k] !== entry.new_data[k] && k !== "id")
                        .slice(0, 5)
                        .map(k => (
                          <div key={k} className="text-xs flex items-center gap-1">
                            <span className="text-muted-foreground/70">{k}:</span>
                            <span className="text-red-400/60 line-through">{String(entry.old_data[k]).slice(0, 30)}</span>
                            <ArrowUpDown className="w-2.5 h-2.5 text-muted-foreground/50" />
                            <span className="text-emerald-400">{String(entry.new_data[k]).slice(0, 30)}</span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
