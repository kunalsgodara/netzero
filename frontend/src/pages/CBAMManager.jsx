import React, { useState, useMemo, useEffect } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, ShieldCheck, Filter, Edit3, Trash2, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import CustomSelect from "@/components/ui/CustomSelect";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { useToast, ToastContainer } from "@/components/ui/Toast";

const db = globalThis.__B44_DB__

// CBAM categories -> DB keys
const CATEGORY_LABELS = {
  cement: "Cement",
  iron_steel: "Iron & Steel",
  aluminum: "Aluminum",
  fertilizers: "Fertilizers",
  electricity: "Electricity",
  hydrogen: "Hydrogen",
};

const STATUS_LABELS = {
  pending: "Pending",
  declared: "Declared",
  verified: "Verified",
};

const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  declared: "bg-blue-100 text-blue-700 border-blue-200",
  verified: "bg-green-100 text-green-700 border-green-200",
};

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];

const EMPTY_FORM = {
  product_name: "",
  hscn_code: "",
  category: "",
  origin_country: "",
  quantity_tonnes: "",
  emission_factor: "",
  embedded_emissions: "",
  carbon_price_eur: "",
  cbam_charge_eur: "",
  import_date: "",
  quarter: "",
  declaration_status: "pending",
  supplier_name: "",
  notes: "",
};

export default function CBAMManager() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const { toasts, toast, removeToast } = useToast();
  const queryClient = useQueryClient();
  const clearFieldError = (field) => setFieldErrors(p => ({ ...p, [field]: false }));

  // ─── Fetch all emission factors, filter to CBAM scope ───────────
  const { data: rawFactors = [], isLoading: isLoadingFactors } = useQuery({
    queryKey: ["emission_factors_cbam"],
    queryFn: () => fetch("/api/v1/emission-factors/cbam").then(r => r.json()),
  });

  // Build CBAM taxonomy and associative arrays for mapping
  const { taxonomy, allHscn, hscnMap } = useMemo(() => {
    const tax = {};
    const list = [];
    const map = {};
    rawFactors
      .forEach((f) => {
        if (!tax[f.category]) tax[f.category] = {};
        const parts = (f.source_dataset || "").split(" | ");
        const description = parts[2] || f.source;
        const data = {
          code: f.source,
          category: f.category,
          description,
          factor: f.factor,
          unit: f.unit,
        };
        tax[f.category][f.source] = data;
        list.push(data);
        map[f.source] = data;
      });
    return { taxonomy: tax, allHscn: list, hscnMap: map };
  }, [rawFactors]);

  // Options for the datalist (filtered if category is selected)
  const currentHscnOptions = useMemo(() => {
    if (form.category && taxonomy[form.category]) {
      return Object.values(taxonomy[form.category]);
    }
    return allHscn;
  }, [form.category, taxonomy, allHscn]);

  // ─── Fetch CBAM EU ETS Price ─────────────────────────────────────
  const { data: currentEtsPrice } = useQuery({
    queryKey: ["cbam-eu-ets-price"],
    queryFn: async () => {
      const res = await fetch("/api/v1/cbam-imports/eu-ets-price");
      return res.json();
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  // ─── Fetch CBAM imports ──────────────────────────────────────────
  const { data: importsData } = useQuery({
    queryKey: ["cbam-imports", currentPage, categoryFilter, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(currentPage),
        page_size: "5",
        order_by: "-created_date",
      });
      if (categoryFilter !== "all") params.set("category", categoryFilter);
      if (statusFilter !== "all") params.set("declaration_status", statusFilter);
      
      const res = await fetch(`/api/v1/cbam-imports?${params.toString()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` },
      });
      return res.json();
    },
  });
  
  const imports = importsData?.items || [];
  const pagination = {
    page: importsData?.page || 1,
    total: importsData?.total || 0,
    totalPages: importsData?.total_pages || 1,
    hasNext: importsData?.has_next || false,
    hasPrev: importsData?.has_prev || false,
  };

  const createMutation = useMutation({
    mutationFn: (data) => db.entities.CBAMImport.create(data),
    onSuccess: () => { 
      queryClient.invalidateQueries({ queryKey: ["cbam-imports"] }); 
      setShowForm(false); 
      resetForm(); 
      setCurrentPage(1); // Reset to first page
      toast("Import saved successfully", "success"); 
    },
    onError: (err) => toast(`Failed to save: ${err.message}`, "error"),
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => db.entities.CBAMImport.update(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["cbam-imports"] }); setShowForm(false); resetForm(); toast("Import updated successfully", "success"); },
    onError: (err) => toast(`Failed to save: ${err.message}`, "error"),
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => db.entities.CBAMImport.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["cbam-imports"] }); toast("Import deleted", "warning"); },
    onError: (err) => toast(`Failed to delete: ${err.message}`, "error"),
  });

  const resetForm = () => { 
    setForm({ 
      ...EMPTY_FORM, 
      carbon_price_eur: currentEtsPrice?.price ? String(currentEtsPrice.price) : "" 
    }); 
    setEditing(null); 
  };

  useEffect(() => {
    if (currentEtsPrice?.price && !editing && form.carbon_price_eur === "") {
      const price = String(currentEtsPrice.price);
      // Auto-recalculate if we already have embedded emissions
      const cbam = calcCbamCharge(form.embedded_emissions, price);
      setForm(f => ({ 
        ...f, 
        carbon_price_eur: price,
        cbam_charge_eur: cbam !== "" ? String(cbam) : ""
      }));
    }
  }, [currentEtsPrice, editing]);

  // ─── Auto-calc helpers ───────────────────────────────────────────
  const calcEmbedded = (qty, ef) => {
    const q = parseFloat(qty) || 0;
    const e = parseFloat(ef) || 0;
    return q > 0 && e > 0 ? parseFloat((q * e).toFixed(4)) : "";
  };
  const calcCbamCharge = (embedded, price) => {
    const em = parseFloat(embedded) || 0;
    const p = parseFloat(price) || 0;
    return em > 0 && p > 0 ? parseFloat((em * p).toFixed(2)) : "";
  };

  // ─── Change handlers ─────────────────────────────────────────────
  const handleCategoryChange = (val) => {
    const updates = { category: val };
    // If category narrows and current hscn forms mismatch, clear it
    if (form.hscn_code && val && taxonomy[val] && !taxonomy[val][form.hscn_code]) {
      updates.hscn_code = "";
      updates.emission_factor = "";
      updates.embedded_emissions = "";
      updates.cbam_charge_eur = "";
    }
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const handleHscnChangeDirect = (val) => {
    const updates = { hscn_code: val };
    const found = hscnMap[val];
    if (found) {
      if (!form.category) updates.category = found.category;
      updates.emission_factor = String(found.factor);
      const embedded = calcEmbedded(form.quantity_tonnes, found.factor);
      const cbam = calcCbamCharge(embedded, form.carbon_price_eur);
      updates.embedded_emissions = embedded !== "" ? String(embedded) : "";
      updates.cbam_charge_eur = cbam !== "" ? String(cbam) : "";
    } else {
      if (form.emission_factor) {
        updates.emission_factor = "";
        updates.embedded_emissions = "";
        updates.cbam_charge_eur = "";
      }
    }
    setForm((prev) => ({ ...prev, ...updates }));
  };

  const handleQuantityChange = (quantity_tonnes) => {
    const embedded = calcEmbedded(quantity_tonnes, form.emission_factor);
    const cbam = calcCbamCharge(embedded, form.carbon_price_eur);
    setForm({ ...form, quantity_tonnes, embedded_emissions: embedded !== "" ? String(embedded) : "", cbam_charge_eur: cbam !== "" ? String(cbam) : "" });
  };

  const handleEmissionFactorChange = (emission_factor) => {
    const embedded = calcEmbedded(form.quantity_tonnes, emission_factor);
    const cbam = calcCbamCharge(embedded, form.carbon_price_eur);
    setForm({ ...form, emission_factor, embedded_emissions: embedded !== "" ? String(embedded) : "", cbam_charge_eur: cbam !== "" ? String(cbam) : "" });
  };

  const handleCarbonPriceChange = (carbon_price_eur) => {
    const cbam = calcCbamCharge(form.embedded_emissions, carbon_price_eur);
    setForm({ ...form, carbon_price_eur, cbam_charge_eur: cbam !== "" ? String(cbam) : "" });
  };

  const handleSave = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.product_name.trim()) errs.product_name = true;
    if (!form.hscn_code.trim()) errs.hscn_code = true;
    if (!form.category) errs.category = true;
    if (!form.origin_country.trim()) errs.origin_country = true;
    if (!form.quantity_tonnes || parseFloat(form.quantity_tonnes) <= 0) errs.quantity_tonnes = true;
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      toast("Please fill in all required fields", "error");
      return;
    }
    setFieldErrors({});
    const data = {
      ...form,
      quantity_tonnes: parseFloat(form.quantity_tonnes) || 0,
      emission_factor: parseFloat(form.emission_factor) || null,
      embedded_emissions: parseFloat(form.embedded_emissions) || null,
      carbon_price_eur: parseFloat(form.carbon_price_eur) || null,
      cbam_charge_eur: parseFloat(form.cbam_charge_eur) || null,
      import_date: form.import_date || null,
      quarter: form.quarter || null,
    };
    if (editing) updateMutation.mutate({ id: editing.id, data });
    else createMutation.mutate(data);
  };

  const startEdit = (imp) => {
    setEditing(imp);
    setForm({
      product_name: imp.product_name,
      hscn_code: imp.hscn_code,
      category: imp.category,
      origin_country: imp.origin_country,
      quantity_tonnes: String(imp.quantity_tonnes),
      emission_factor: String(imp.emission_factor || ""),
      embedded_emissions: String(imp.embedded_emissions || ""),
      carbon_price_eur: String(imp.carbon_price_eur || ""),
      cbam_charge_eur: String(imp.cbam_charge_eur || ""),
      import_date: imp.import_date ? String(imp.import_date).substring(0, 10) : "",
      quarter: imp.quarter || "",
      declaration_status: imp.declaration_status || "pending",
      supplier_name: imp.supplier_name || "",
      notes: imp.notes || "",
    });
    setShowForm(true);
  };

  // ─── Filtering ────────────────────────────────────────────────────
  // Note: Filtering now happens on backend via query params
  const totalEmissions = imports.reduce((s, i) => s + (i.embedded_emissions || 0), 0);
  const totalCharge = imports.reduce((s, i) => s + (i.cbam_charge_eur || 0), 0);

  // Computed display values for form
  const displayEmbedded = parseFloat(form.embedded_emissions) || 0;
  const displayCharge = parseFloat(form.cbam_charge_eur) || 0;

  const factorsLoaded = rawFactors.length > 0;

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 overflow-auto">
        <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
          <ToastContainer toasts={toasts} onRemove={removeToast} />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">CBAM Manager</h1>
            <p className="text-xs text-muted-foreground">Carbon Border Adjustment Mechanism — EU default emission factors</p>
          </div>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Add Import
        </button>
      </div>

      {/* Factor loading notice */}
      {isLoadingFactors && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-xs text-amber-700">
          Loading CBAM emission factors from database…
        </div>
      )}
      {!isLoadingFactors && !factorsLoaded && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-xs text-amber-700">
          ⚠ CBAM emission factors not yet seeded. Restart the backend server to trigger automatic seeding.
        </div>
      )}

      {/* ─── Form ──────────────────────────────────────────────────── */}
      {showForm && (
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-bold text-foreground mb-6">{editing ? "Edit CBAM Import" : "Log CBAM Import"}</h3>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Left Column Fields */}
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-semibold text-foreground">Product Name *</label>
                  <input
                    value={form.product_name}
                    onChange={(e) => { setForm({ ...form, product_name: e.target.value }); clearFieldError("product_name"); }}
                    className={`w-full mt-2 px-3 py-2 border rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none ${fieldErrors.product_name ? "border-red-400 bg-red-50/30" : ""}`}
                    placeholder="e.g. Hot-rolled steel coils" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground">HSCN Code *</label>
                  <SearchableSelect
                    className="mt-2"
                    value={form.hscn_code}
                    onChange={(val) => { handleHscnChangeDirect(val); clearFieldError("hscn_code"); }}
                    hasError={!!fieldErrors.hscn_code}
                    placeholder="Search HSCN code..."
                    searchPlaceholder="Type code or description..."
                    options={currentHscnOptions.map((opt) => ({
                      value: opt.code,
                      label: opt.code,
                      sublabel: opt.description,
                    }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground">Quantity (tonnes) *</label>
                  <input
                    type="number" step="any" min="0"
                    value={form.quantity_tonnes}
                    onChange={(e) => { handleQuantityChange(e.target.value); clearFieldError("quantity_tonnes"); }}
                    className={`w-full mt-2 px-3 py-2 border rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none ${fieldErrors.quantity_tonnes ? "border-red-400 bg-red-50/30" : ""}`}
                    placeholder="0.00" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground flex items-center justify-between">
                    Import Date
                  </label>
                  <input
                    type="date"
                    value={form.import_date}
                    onChange={(e) => setForm({ ...form, import_date: e.target.value })}
                    max={new Date().toISOString().split("T")[0]}
                    className="w-full mt-2 px-3 py-2 border rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground">Supplier</label>
                  <input
                    value={form.supplier_name}
                    onChange={(e) => setForm({ ...form, supplier_name: e.target.value })}
                    className="w-full mt-2 px-3 py-2 border rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    placeholder="Supplier name" />
                </div>
              </div>
              
              {/* Right Column Fields */}
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-semibold text-foreground">Category *</label>
                  <CustomSelect
                    className="mt-2"
                    value={form.category}
                    onChange={(val) => { handleCategoryChange(val); clearFieldError("category"); }}
                    placeholder="Select category..."
                    options={Object.entries(CATEGORY_LABELS).map(([k, v]) => ({ value: k, label: v }))}
                    hasError={!!fieldErrors.category}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground">Origin Country *</label>
                  <input
                    value={form.origin_country}
                    onChange={(e) => { setForm({ ...form, origin_country: e.target.value }); clearFieldError("origin_country"); }}
                    className={`w-full mt-2 px-3 py-2 border rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none ${fieldErrors.origin_country ? "border-red-400 bg-red-50/30" : ""}`}
                    placeholder="e.g. Turkey" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground">Emission Factor (tCO₂e/t)</label>
                  <input
                    type="number" step="any" min="0"
                    value={form.emission_factor}
                    onChange={(e) => handleEmissionFactorChange(e.target.value)}
                    className="w-full mt-2 px-3 py-2 border rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                    placeholder="Auto-filled or manual" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground">Quarter</label>
                  <CustomSelect
                    className="mt-2"
                    value={form.quarter}
                    onChange={(val) => setForm({ ...form, quarter: val })}
                    placeholder="Select quarter"
                    options={QUARTERS.map((q) => ({ value: q, label: q }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground">Declaration Status</label>
                  <CustomSelect
                    className="mt-2"
                    value={form.declaration_status}
                    onChange={(val) => setForm({ ...form, declaration_status: val })}
                    options={Object.entries(STATUS_LABELS).map(([k, v]) => ({ value: k, label: v }))}
                  />
                </div>
              </div>
            </div>

            {/* Notes Field Full Width */}
            <div>
              <label className="text-sm font-semibold text-foreground">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className="w-full mt-2 px-3 py-2 border rounded-lg text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none resize-none"
                placeholder="" />
            </div>

            {/* LIVE CALCULATION Bottom Bar */}
            <div className="bg-emerald-50/50 rounded-lg p-5 mt-4">
              <p className="text-xs font-bold text-emerald-800 tracking-wider mb-4 uppercase">LIVE CALCULATION</p>
              <div className="grid grid-cols-3 divide-x divide-emerald-200">
                <div className="text-center px-4">
                  <p className="text-xl font-bold text-foreground">
                    {displayEmbedded > 0 ? displayEmbedded.toFixed(2) : "0.00"}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-1">tCO₂e Embedded</p>
                </div>
                
                <div className="text-center px-4">
                  <div className="flex items-center justify-center gap-0.5">
                    <span className="text-xl font-bold text-foreground">€</span>
                    <input
                      type="number" step="any" min="0" max="10000"
                      value={form.carbon_price_eur}
                      onChange={(e) => handleCarbonPriceChange(e.target.value)}
                      className="w-16 bg-transparent text-center text-xl font-bold text-foreground outline-none border-b border-transparent focus:border-emerald-400 hover:border-emerald-300 px-1 placeholder:text-gray-400"
                      placeholder="75"
                    />
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">Carbon Price/t</p>
                </div>

                <div className="text-center px-4">
                  <p className="text-xl font-bold text-emerald-600">
                    €{displayCharge > 0 ? displayCharge.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : "0"}
                  </p>
                  <p className="text-[11px] text-emerald-600/70 mt-1">CBAM Charge</p>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t mt-6">
              <button
                type="button"
                onClick={() => { setShowForm(false); resetForm(); }}
                className="px-4 py-2 bg-gray-50 border border-gray-200 rounded text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-1.5"
              >
                <div className="scale-90"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></div>
                Cancel
              </button>
              <button
                type="submit"
                disabled={!form.category || !form.hscn_code || !form.quantity_tonnes}
                className="px-4 py-2 bg-emerald-500 text-white rounded text-sm font-medium hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
              >
                <div className="scale-90"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg></div>
                Save Import
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── KPI Cards ──────────────────────────────────────────────── */}
      {!showForm && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Total Imports</p>
            <p className="text-2xl font-bold text-foreground mt-1">{pagination.total}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Embedded Emissions</p>
            <p className="text-2xl font-bold text-foreground mt-1">{totalEmissions.toFixed(1)} <span className="text-sm font-normal">tCO₂e</span></p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Projected Charges</p>
            <p className="text-2xl font-bold text-primary mt-1">€{totalCharge.toLocaleString("en-GB", { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      )}

      {/* ─── Filters & Table ──────────────────────────────────────────────── */}
      {!showForm && (
        <>
          <div className="flex items-center gap-3 flex-wrap">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <div className="w-40">
              <CustomSelect
                value={categoryFilter}
                onChange={(val) => { setCategoryFilter(val); setCurrentPage(1); }}
                options={[
                  { value: "all", label: "All Categories" },
                  ...Object.entries(CATEGORY_LABELS).map(([k, v]) => ({ value: k, label: v }))
                ]}
              />
            </div>
            <div className="w-36">
              <CustomSelect
                value={statusFilter}
                onChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}
                options={[
                  { value: "all", label: "All Statuses" },
                  ...Object.entries(STATUS_LABELS).map(([k, v]) => ({ value: k, label: v }))
                ]}
              />
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Product</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden sm:table-cell">HSCN Code</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden md:table-cell">Category</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden md:table-cell">Origin</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground hidden lg:table-cell">Date / Quarter</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Tonnes</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground hidden lg:table-cell">tCO₂e</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Charge (€)</th>
                  <th className="text-center px-4 py-2.5 font-medium text-muted-foreground">Status</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {imports.map((imp) => (
                  <tr key={imp.id} className="hover:bg-muted/30 transition-colors border-b border-border">
                    <td className="px-4 py-2.5 font-medium text-foreground">{imp.product_name}</td>
                    <td className="px-4 py-2.5 text-muted-foreground hidden sm:table-cell font-mono">{imp.hscn_code || "—"}</td>
                    <td className="px-4 py-2.5 text-muted-foreground hidden md:table-cell">{CATEGORY_LABELS[imp.category] || imp.category}</td>
                    <td className="px-4 py-2.5 text-muted-foreground hidden md:table-cell">{imp.origin_country}</td>
                    <td className="px-4 py-2.5 text-muted-foreground hidden lg:table-cell">
                      {imp.import_date ? new Date(imp.import_date).toLocaleDateString("en-GB") : "—"}
                      {imp.quarter && <span className="ml-2 px-1.5 py-0.5 bg-muted rounded text-[10px]">{imp.quarter}</span>}
                    </td>
                    <td className="px-4 py-2.5 text-right text-foreground">{imp.quantity_tonnes?.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right text-foreground hidden lg:table-cell">
                      {imp.embedded_emissions ? imp.embedded_emissions.toFixed(2) : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-primary">
                      {imp.cbam_charge_eur ? `€${imp.cbam_charge_eur.toLocaleString("en-GB", { minimumFractionDigits: 2 })}` : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-medium ${STATUS_COLORS[imp.declaration_status] || ""}`}>
                        {STATUS_LABELS[imp.declaration_status] || imp.declaration_status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button onClick={() => startEdit(imp)} className="p-1 hover:bg-muted rounded"><Edit3 className="w-3.5 h-3.5 text-muted-foreground" /></button>
                      <button onClick={() => deleteMutation.mutate(imp.id)} className="p-1 hover:bg-destructive/10 rounded ml-1"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                    </td>
                  </tr>
                ))}
                {imports.length === 0 && (
                  <tr><td colSpan="10" className="px-4 py-8 text-center text-muted-foreground">
                    No CBAM imports found. Add your first import above.
                  </td></tr>
                )}
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
                  Showing {imports.length > 0 ? ((pagination.page - 1) * 5 + 1) : 0} to {Math.min(pagination.page * 5, pagination.total)} of {pagination.total} imports
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
