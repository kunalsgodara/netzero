import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Activity, Filter, Edit3, Trash2, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import CustomSelect from "@/components/ui/CustomSelect";
import { useToast } from "@/hooks/useToast";

import db from "@/api/client"

const SCOPE_LABELS = { scope_1: "Scope 1", scope_2: "Scope 2", scope_3: "Scope 3" };
const SCOPE_COLORS = {
  scope_1: "bg-red-100 text-red-700",
  scope_2: "bg-amber-100 text-amber-700",
  scope_3: "bg-blue-100 text-blue-700",
};

const EMPTY_FORM = {
  activity_name: "", activity_date: "", scope: "", category: "", source: "",
  quantity: "", unit: "", emission_factor: "", co2e_kg: "",
};

export default function Emissions() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [scopeFilter, setScopeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const { toasts, toast, removeToast } = useToast();
  const queryClient = useQueryClient();

  const { data: rawFactors = [] } = useQuery({
    queryKey: ["emission_factors"],
    queryFn: () => fetch("/api/v1/emission-factors").then(r => r.json()),
  });

  const EMISSION_TAXONOMY = React.useMemo(() => {
    const taxonomy = {};
    rawFactors.forEach(f => {
      const scopeKey = f.scope.toLowerCase().replace(/ /g, "_");
      if (!taxonomy[scopeKey]) {
        taxonomy[scopeKey] = { label: f.scope, categories: {} };
      }
      if (!taxonomy[scopeKey].categories[f.category]) {
        taxonomy[scopeKey].categories[f.category] = { description: "", sources: {} };
      }
      taxonomy[scopeKey].categories[f.category].sources[f.source] = {
        unit: f.unit, ef: f.factor, source_dataset: f.source_dataset
      };
    });
    return taxonomy;
  }, [rawFactors]);

  const { data: activitiesData } = useQuery({
    queryKey: ["emissions", currentPage, scopeFilter, categoryFilter, monthFilter, yearFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(currentPage),
        page_size: "5",
        order_by: "-created_date",
      });
      if (scopeFilter !== "all") params.set("scope", scopeFilter);
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (monthFilter !== "all") params.set("month", monthFilter);
      if (yearFilter !== "all") params.set("year", yearFilter);
      
      const res = await fetch(`/api/v1/emission-activities?${params.toString()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
      });
      return res.json();
    },
  });
  
  const activities = activitiesData?.items || [];
  const pagination = {
    page: activitiesData?.page || 1,
    total: activitiesData?.total || 0,
    totalPages: activitiesData?.total_pages || 1,
    hasNext: activitiesData?.has_next || false,
    hasPrev: activitiesData?.has_prev || false,
  };

  const createMutation = useMutation({
    mutationFn: (data) => db.entities.EmissionActivity.create(data),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ["emissions"] }); 
      setShowForm(false); 
      resetForm(); 
      setCurrentPage(1);
      toast("Activity saved successfully", "success"); 
    },
    onError: (err) => toast(`Failed to save: ${err.message}`, "error"),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => db.entities.EmissionActivity.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["emissions"] }); setShowForm(false); resetForm(); toast("Activity updated successfully", "success"); },
    onError: (err) => toast(`Failed to save: ${err.message}`, "error"),
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => db.entities.EmissionActivity.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["emissions"] }); toast("Activity deleted", "warning"); },
    onError: (err) => toast(`Failed to delete: ${err.message}`, "error"),
  });

  const resetForm = () => { setForm(EMPTY_FORM); setEditing(null); };

  const categoryOptions = useMemo(() => {
    if (!form.scope || !EMISSION_TAXONOMY[form.scope]) return [];
    return Object.keys(EMISSION_TAXONOMY[form.scope].categories);
  }, [form.scope, EMISSION_TAXONOMY]);

  const sourceOptions = useMemo(() => {
    if (!form.scope || !form.category) return [];
    const cat = EMISSION_TAXONOMY[form.scope]?.categories?.[form.category];
    return cat ? Object.keys(cat.sources) : [];
  }, [form.scope, form.category, EMISSION_TAXONOMY]);

  const categoryDescription = useMemo(() => {
    if (!form.scope || !form.category) return "";
    return EMISSION_TAXONOMY[form.scope]?.categories?.[form.category]?.description || "";
  }, [form.scope, form.category, EMISSION_TAXONOMY]);

  const handleScopeChange = (scope) => {
    clearFieldError("scope");
    setForm({ ...form, scope, category: "", source: "", unit: "", emission_factor: "", co2e_kg: "" });
  };

  const handleCategoryChange = (category) => {
    clearFieldError("category");
    setForm({ ...form, category, source: "", unit: "", emission_factor: "", co2e_kg: "" });
  };

  const handleSourceChange = (source) => {
    clearFieldError("source");
    const sourceData = EMISSION_TAXONOMY[form.scope]?.categories?.[form.category]?.sources?.[source];
    if (sourceData) {
      const ef = sourceData.ef;
      const qty = parseFloat(form.quantity) || 0;
      const co2e = qty > 0 && ef > 0 ? (qty * ef).toFixed(2) : "";
      setForm({ ...form, source, unit: sourceData.unit, emission_factor: String(ef), co2e_kg: co2e });
    } else {
      setForm({ ...form, source, unit: "", emission_factor: "", co2e_kg: "" });
    }
  };

  const handleQuantityChange = (quantity) => {
    const ef = parseFloat(form.emission_factor) || 0;
    const qty = parseFloat(quantity) || 0;
    const co2e = qty > 0 && ef > 0 ? (qty * ef).toFixed(2) : "";
    setForm({ ...form, quantity, co2e_kg: co2e });
  };

  const clearFieldError = (field) => setFieldErrors(p => ({ ...p, [field]: false }));

  const handleSave = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.activity_name.trim()) errs.activity_name = true;
    if (!form.activity_date) errs.activity_date = true;
    if (!form.scope) errs.scope = true;
    if (!form.category) errs.category = true;
    if (!form.source) errs.source = true;
    if (!form.quantity || parseFloat(form.quantity) <= 0) errs.quantity = true;
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      toast("Please fill in all required fields", "error");
      return;
    }
    setFieldErrors({});
    const data = {
      ...form,
      activity_date: form.activity_date || null,
      quantity: parseFloat(form.quantity) || 0,
      emission_factor: parseFloat(form.emission_factor) || null,
      co2e_kg: parseFloat(form.co2e_kg) || null,
    };
    if (editing) updateMutation.mutate({ id: editing.id, data });
    else createMutation.mutate(data);
  };

  const startEdit = (a) => {
    setEditing(a);
    setForm({
      activity_name: a.activity_name,
      activity_date: a.activity_date ? String(a.activity_date).substring(0, 10) : "",
      scope: a.scope, category: a.category || "",
      source: a.source || "", quantity: String(a.quantity), unit: a.unit,
      emission_factor: String(a.emission_factor || ""), co2e_kg: String(a.co2e_kg || ""),
    });
    setShowForm(true);
  };

  const totalTCO2e = activities.reduce((s, a) => s + (a.co2e_kg || 0), 0) / 1000;

  const filterCategoryOptions = useMemo(() => {
    if (scopeFilter === "all") return [];
    return Object.keys(EMISSION_TAXONOMY[scopeFilter]?.categories || {});
  }, [scopeFilter, EMISSION_TAXONOMY]);

  const calculatedCO2e = parseFloat(form.co2e_kg) || 0;

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 overflow-auto">
        <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Emission Activities</h1>
            <p className="text-xs text-muted-foreground">Track Scope 1, 2 & 3 activities</p>
          </div>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4 mr-1.5" /> Add Activity
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="text-base font-semibold text-foreground mb-4">{editing ? "Edit Activity" : "New Activity"}</h3>
          <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Activity Name *</label>
                <input value={form.activity_name} onChange={(e) => { setForm({...form, activity_name: e.target.value}); clearFieldError("activity_name"); }}
                  className={`w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none ${fieldErrors.activity_name ? "border-red-400 bg-red-50/30" : "border-border"}`} placeholder="e.g. Office Heating" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Activity Date *</label>
                <input type="date" value={form.activity_date} onChange={(e) => { setForm({...form, activity_date: e.target.value}); clearFieldError("activity_date"); }}
                  max={new Date().toISOString().split("T")[0]}
                  className={`w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none ${fieldErrors.activity_date ? "border-red-400 bg-red-50/30" : "border-border"}`} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Scope *</label>
                <CustomSelect
                  className="mt-1"
                  value={form.scope}
                  onChange={(val) => handleScopeChange(val)}
                  placeholder="Select scope..."
                  options={Object.entries(EMISSION_TAXONOMY).map(([key, val]) => ({ value: key, label: val.label }))}
                  hasError={!!fieldErrors.scope}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Category *</label>
                <CustomSelect
                  className="mt-1"
                  value={form.category}
                  onChange={(val) => handleCategoryChange(val)}
                  disabled={!form.scope}
                  placeholder={form.scope ? "Select category..." : "Select scope first"}
                  options={categoryOptions.map(c => ({ value: c, label: c }))}
                  hasError={!!fieldErrors.category}
                />
                {categoryDescription && (
                  <p className="text-[10px] text-muted-foreground mt-1 italic">{categoryDescription}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Source *</label>
                <CustomSelect
                  className="mt-1"
                  value={form.source}
                  onChange={(val) => handleSourceChange(val)}
                  disabled={!form.category}
                  placeholder={form.category ? "Select source..." : "Select category first"}
                  options={sourceOptions.map(s => ({ value: s, label: s }))}
                  hasError={!!fieldErrors.source}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Unit</label>
                <input value={form.unit} readOnly
                  className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-muted/40 text-foreground cursor-default"
                  placeholder="Auto-set by source" />
                {form.unit && (
                  <p className="text-[10px] text-primary mt-1 font-medium">✓ Unit auto-mapped to: {form.unit}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:items-end">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Quantity *</label>
                <input type="number" step="any" value={form.quantity} onChange={(e) => { handleQuantityChange(e.target.value); clearFieldError("quantity"); }}
                  className={`w-full mt-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none ${fieldErrors.quantity ? "border-red-400 bg-red-50/30" : "border-border"}`}
                  placeholder={form.unit ? `Enter amount in ${form.unit}` : "Enter quantity"} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Emission Factor (kgCO₂e/{form.unit || "unit"})</label>
                <input type="number" step="any" value={form.emission_factor} readOnly
                  className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-sm bg-muted/40 cursor-default" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Zap className="w-3 h-3 text-amber-500" /> Calculated Emissions
                </label>
                <div className={`w-full mt-1 px-3 py-2 border rounded-lg text-sm font-bold ${calculatedCO2e > 0 ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-border bg-muted/40 text-muted-foreground"}`}>
                  {calculatedCO2e > 0 ? `${calculatedCO2e.toFixed(2)} kgCO₂e` : "—"}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted transition-colors">Cancel</button>
              <button type="submit" disabled={!form.scope || !form.category || !form.source} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">Save Activity</button>
            </div>
          </form>
        </div>
      )}

      {!showForm && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Activities</p>
              <p className="text-2xl font-bold text-foreground mt-1">{pagination.total}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Total Emissions</p>
              <p className="text-2xl font-bold text-foreground mt-1">{totalTCO2e.toFixed(2)} <span className="text-sm font-normal">tCO₂e</span></p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Avg per Activity</p>
              <p className="text-2xl font-bold text-foreground mt-1">{pagination.total > 0 ? ((totalTCO2e / pagination.total) * 1000).toFixed(0) : 0} <span className="text-sm font-normal">kgCO₂e</span></p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <div className="w-36">
              <CustomSelect
                value={scopeFilter}
                onChange={(val) => { setScopeFilter(val); setCategoryFilter("all"); setCurrentPage(1); }}
                options={[
                  { value: "all", label: "All Scopes" },
                  ...Object.entries(EMISSION_TAXONOMY).map(([key, val]) => ({ value: key, label: val.label }))
                ]}
              />
            </div>
            {filterCategoryOptions.length > 0 && (
              <div className="w-44">
                <CustomSelect
                  value={categoryFilter}
                  onChange={(val) => { setCategoryFilter(val); setCurrentPage(1); }}
                  options={[
                    { value: "all", label: "All Categories" },
                    ...filterCategoryOptions.map(c => ({ value: c, label: c }))
                  ]}
                />
              </div>
            )}
            <div className="w-36">
              <CustomSelect
                value={monthFilter}
                onChange={(val) => { setMonthFilter(val); setCurrentPage(1); }}
                options={[
                  { value: "all", label: "All Months" },
                  { value: "1", label: "January" },
                  { value: "2", label: "February" },
                  { value: "3", label: "March" },
                  { value: "4", label: "April" },
                  { value: "5", label: "May" },
                  { value: "6", label: "June" },
                  { value: "7", label: "July" },
                  { value: "8", label: "August" },
                  { value: "9", label: "September" },
                  { value: "10", label: "October" },
                  { value: "11", label: "November" },
                  { value: "12", label: "December" }
                ]}
              />
            </div>
            <div className="w-32">
              <CustomSelect
                value={yearFilter}
                onChange={(val) => { setYearFilter(val); setCurrentPage(1); }}
                options={[
                  { value: "all", label: "All Years" },
                  ...Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => ({
                    value: String(year),
                    label: String(year)
                  }))
                ]}
              />
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-muted/50"><tr>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Activity</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden sm:table-cell">Date</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Scope</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden lg:table-cell">Source</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Quantity</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">CO₂e (kg)</th>
                <th className="text-right px-4 py-2.5 font-medium text-muted-foreground w-20">Actions</th>
              </tr></thead>
              <tbody>
                {activities.map(a => (
                  <tr key={a.id} className="hover:bg-muted/30 transition-colors border-b border-border">
                    <td className="px-4 py-2.5 font-medium text-foreground">{a.activity_name}</td>
                    <td className="px-4 py-2.5 text-muted-foreground hidden sm:table-cell">{a.activity_date ? new Date(a.activity_date).toLocaleDateString() : "—"}</td>
                    <td className="px-4 py-2.5"><span className={`px-2 py-0.5 rounded text-[10px] font-medium ${SCOPE_COLORS[a.scope] || ""}`}>{SCOPE_LABELS[a.scope] || a.scope}</span></td>
                    <td className="px-4 py-2.5 text-muted-foreground hidden md:table-cell">{a.category || "—"}</td>
                    <td className="px-4 py-2.5 text-muted-foreground hidden lg:table-cell">{a.source || "—"}</td>
                    <td className="px-4 py-2.5 text-right text-foreground">{a.quantity} {a.unit}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-foreground">{a.co2e_kg?.toFixed(1) || "—"}</td>
                    <td className="px-4 py-2.5 text-right">
                      <button onClick={() => startEdit(a)} className="p-1 hover:bg-muted rounded"><Edit3 className="w-3.5 h-3.5 text-muted-foreground" /></button>
                      <button onClick={() => deleteMutation.mutate(a.id)} className="p-1 hover:bg-destructive/10 rounded ml-1"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                    </td>
                  </tr>
                ))}
                {activities.length === 0 && <tr><td colSpan="8" className="px-4 py-8 text-center text-muted-foreground">No activities found. Add your first emission activity above.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
        </div>
      </div>
      
      {!showForm && (
        <div className="bg-background">
          <div className="p-3 lg:p-4 max-w-[1400px] mx-auto">
            <div className="bg-card border border-border rounded-xl px-4 py-2">
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  Showing {activities.length > 0 ? ((pagination.page - 1) * 5 + 1) : 0} to {Math.min(pagination.page * 5, pagination.total)} of {pagination.total} activities
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
