
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Search, AlertTriangle, Info } from "lucide-react";
import { cbamApi } from "@/services/cbamApiService";
import FormulaBreakdown from "@/components/cbam/FormulaBreakdown";
import SavingsCallout from "@/components/cbam/SavingsCallout";

const COUNTRIES = [
  "China", "India", "Turkey", "Russia", "Ukraine", "Brazil", "South Africa",
  "Vietnam", "Indonesia", "Thailand", "Malaysia", "Egypt", "Saudi Arabia",
  "South Korea", "Japan", "Taiwan", "United States", "Germany", "France", "Other",
];

export default function AddImportPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  
  const [form, setForm] = useState({
    product_id: "",
    import_date: "",
    import_value_gbp: "",
    quantity_tonnes: "",
    country_of_origin: "",
    import_type: "standard",
    data_source: "default",
    emissions_intensity_actual: "",
    verifier_name: "",
    verification_date: "",
    carbon_price_deduction_gbp: "0",
    deduction_evidence_note: "",
    deduction_confirmed: false,
    installation_name: "",
    installation_id: "",
    production_route: "",
  });

  
  const { data: products } = useQuery({
    queryKey: ["cbam-products"],
    queryFn: () => cbamApi.getProducts(),
    staleTime: 10 * 60 * 1000,
  });

  const { data: etsPrice } = useQuery({
    queryKey: ["ets-price-current"],
    queryFn: () => cbamApi.getCurrentETSPrice(),
    staleTime: 5 * 60 * 1000,
  });

  const selectedProduct = useMemo(
    () => products?.find((p) => p.id === form.product_id),
    [products, form.product_id]
  );

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!searchTerm) return products;
    const q = searchTerm.toLowerCase();
    return products.filter(
      (p) => p.commodity_code.includes(q) || p.description.toLowerCase().includes(q) || p.sector.includes(q)
    );
  }, [products, searchTerm]);

  
  const previewCalc = useMemo(() => {
    if (!selectedProduct || !etsPrice) return null;
    const qty = parseFloat(form.quantity_tonnes) || 0;
    const intensityDefault = parseFloat(selectedProduct.default_intensity);
    const intensity = form.data_source !== "default" && form.emissions_intensity_actual
      ? parseFloat(form.emissions_intensity_actual)
      : intensityDefault;
    const rate = parseFloat(etsPrice.price_gbp);
    const deduction = parseFloat(form.carbon_price_deduction_gbp) || 0;
    const deductionTco2e = rate > 0 ? deduction / rate : 0;

    const isReturned = form.import_type === "returned_goods";
    const embedded = qty * intensity;
    const net = Math.max(0, embedded - deductionTco2e);
    const liability = isReturned ? 0 : net * rate;

    const defaultEmbedded = qty * intensityDefault;
    const defaultNet = Math.max(0, defaultEmbedded - deductionTco2e);
    const defaultLiability = defaultNet * rate;
    const saving = defaultLiability - liability;

    return {
      embedded: embedded.toFixed(4),
      liability: liability.toFixed(2),
      defaultLiability: defaultLiability.toFixed(2),
      saving: saving.toFixed(2),
      intensity: intensity.toFixed(4),
    };
  }, [form, selectedProduct, etsPrice]);

  
  const createMutation = useMutation({
    mutationFn: () => {
      const payload = {
        product_id: form.product_id,
        import_date: form.import_date,
        import_value_gbp: parseFloat(form.import_value_gbp),
        quantity_tonnes: parseFloat(form.quantity_tonnes),
        country_of_origin: form.country_of_origin,
        import_type: form.import_type,
        data_source: form.data_source,
        carbon_price_deduction_gbp: parseFloat(form.carbon_price_deduction_gbp) || 0,
        deduction_evidence_note: form.deduction_evidence_note || null,
        emissions_intensity_actual: form.data_source !== "default" && form.emissions_intensity_actual
          ? parseFloat(form.emissions_intensity_actual) : null,
        verifier_name: form.verifier_name || null,
        verification_date: form.verification_date || null,
        installation_name: form.installation_name || null,
        installation_id: form.installation_id || null,
        production_route: form.production_route || null,
      };
      return cbamApi.createImport(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cbam-imports"] });
      queryClient.invalidateQueries({ queryKey: ["threshold-status"] });
      navigate("/CBAMManager");
    },
  });

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  
  const canNext = () => {
    switch(step) {
      case 1: return !!form.product_id;
      case 2: return form.import_date && form.import_value_gbp && form.quantity_tonnes && form.country_of_origin;
      case 3: {
        if (form.data_source !== "default" && !form.emissions_intensity_actual) return false;
        if (parseFloat(form.carbon_price_deduction_gbp) > 0 && !form.deduction_confirmed) return false;
        return true;
      }
      default: return true;
    }
  };

  const stepLabels = ["Select Product", "Import Details", "Emissions Data", "Review & Save"];

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      
      <div className="flex items-center gap-4">
        <button onClick={() => navigate("/CBAMManager")} className="p-2 rounded-lg bg-background hover:bg-muted transition-colors">
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Add CBAM Import</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Step {step} of 4 — {stepLabels[step - 1]}</p>
        </div>
      </div>

      
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className={`flex-1 h-1.5 rounded-full transition-all ${s <= step ? 'bg-emerald-500' : 'bg-muted'}`} />
        ))}
      </div>

      
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
              <input
                type="text" placeholder="Search by commodity code, description, or sector..."
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-background border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Info className="w-3 h-3" />
              CN codes are 8-digit commodity codes (e.g. 72071100)
            </p>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {filteredProducts.map((p) => (
              <button
                key={p.id}
                onClick={() => update("product_id", p.id)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  form.product_id === p.id
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : "bg-card border-border hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold font-mono text-emerald-500">{p.commodity_code}</span>
                      <span className="text-[10px] text-muted-foreground/70 uppercase tracking-wider px-2 py-0.5 rounded bg-muted">{p.sector}</span>
                    </div>
                    <p className="text-sm font-medium text-foreground mt-1">{p.description}</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm font-mono text-emerald-400">{p.default_intensity} tCO₂e/t</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Import Date</label>
            <input type="date" value={form.import_date} onChange={(e) => update("import_date", e.target.value)}
              className="w-full mt-1 px-4 py-2.5 rounded-lg bg-background border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-emerald-500/40" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Quantity (tonnes)</label>
              <input type="number" step="0.01" value={form.quantity_tonnes} onChange={(e) => update("quantity_tonnes", e.target.value)}
                className="w-full mt-1 px-4 py-2.5 rounded-lg bg-background border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-emerald-500/40" placeholder="e.g. 100" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Import Value (£ GBP)</label>
              <input type="number" step="0.01" value={form.import_value_gbp} onChange={(e) => update("import_value_gbp", e.target.value)}
                className="w-full mt-1 px-4 py-2.5 rounded-lg bg-background border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-emerald-500/40" placeholder="e.g. 25000" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Country of Origin</label>
            <select value={form.country_of_origin} onChange={(e) => update("country_of_origin", e.target.value)}
              className="w-full mt-1 px-4 py-2.5 rounded-lg bg-background border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-emerald-500/40">
              <option value="">Select country...</option>
              {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          
          {/* Installation Fields (Optional) */}
          <div className="border-t border-border pt-4 space-y-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Installation Details (Optional)
            </p>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Installation Name</label>
              <input 
                type="text" 
                value={form.installation_name} 
                onChange={(e) => update("installation_name", e.target.value)}
                maxLength={255}
                className="w-full mt-1 px-4 py-2.5 rounded-lg bg-background border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-emerald-500/40" 
                placeholder="e.g. Sheffield Steel Works" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Installation ID</label>
                <input 
                  type="text" 
                  value={form.installation_id} 
                  onChange={(e) => update("installation_id", e.target.value)}
                  maxLength={100}
                  pattern="[A-Za-z0-9]*"
                  className="w-full mt-1 px-4 py-2.5 rounded-lg bg-background border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-emerald-500/40" 
                  placeholder="e.g. UK12345" 
                />
                <p className="text-[10px] text-muted-foreground/70 mt-1">Alphanumeric only</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Production Route</label>
                <select 
                  value={form.production_route} 
                  onChange={(e) => update("production_route", e.target.value)}
                  className="w-full mt-1 px-4 py-2.5 rounded-lg bg-background border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-emerald-500/40"
                >
                  <option value="">Select route...</option>
                  <option value="BF-BOF">BF-BOF (Blast Furnace)</option>
                  <option value="EAF-scrap">EAF-scrap (Electric Arc)</option>
                  <option value="DRI">DRI (Direct Reduced Iron)</option>
                  <option value="Smelting-electrolysis">Smelting-electrolysis</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Import Type</label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {[
                { val: "standard", label: "Standard", desc: "Regular import" },
                { val: "outward_processing", label: "Outward Processing", desc: "Processing-stage emissions only" },
                { val: "returned_goods", label: "Returned Goods", desc: "Re-imported within 3 years — EXEMPT" },
              ].map((t) => (
                <button key={t.val} onClick={() => update("import_type", t.val)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    form.import_type === t.val ? "bg-emerald-500/10 border-emerald-500/30" : "bg-card border-border hover:bg-muted/50"
                  }`}>
                  <p className="text-sm font-medium text-foreground">{t.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>
          {form.import_type === "returned_goods" && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm text-blue-300">
              <Info className="w-4 h-4 flex-shrink-0" />
              Returned goods are exempt from UK CBAM liability. The liability will be set to £0.
            </div>
          )}
        </div>
      )}

      
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Data Source</label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {[
                { val: "default", label: "Default", desc: "HMRC default values", color: "amber" },
                { val: "actual_unverified", label: "Actual (Unverified)", desc: "Supplier data, not yet verified", color: "blue" },
                { val: "actual_verified", label: "Actual (Verified)", desc: "Third-party verified data", color: "emerald" },
              ].map((t) => (
                <button key={t.val} onClick={() => update("data_source", t.val)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    form.data_source === t.val ? `bg-${t.color}-500/10 border-${t.color}-500/30` : "bg-card border-border hover:bg-muted/50"
                  }`}>
                  <p className="text-sm font-medium text-foreground">{t.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {form.data_source !== "default" && (
            <>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Actual Emission Intensity (tCO₂e/tonne)</label>
                <input type="number" step="0.0001" value={form.emissions_intensity_actual}
                  onChange={(e) => update("emissions_intensity_actual", e.target.value)}
                  className="w-full mt-1 px-4 py-2.5 rounded-lg bg-background border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-emerald-500/40"
                  placeholder={`Default: ${selectedProduct?.default_intensity || "—"}`} />
              </div>
              {form.data_source === "actual_verified" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Verifier Name</label>
                    <input type="text" value={form.verifier_name} onChange={(e) => update("verifier_name", e.target.value)}
                      className="w-full mt-1 px-4 py-2.5 rounded-lg bg-background border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-emerald-500/40"
                      placeholder="e.g. Bureau Veritas" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Verification Date</label>
                    <input type="date" value={form.verification_date} onChange={(e) => update("verification_date", e.target.value)}
                      className="w-full mt-1 px-4 py-2.5 rounded-lg bg-background border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-emerald-500/40" />
                  </div>
                </div>
              )}
              
              {previewCalc && parseFloat(previewCalc.saving) > 0 && (
                <SavingsCallout data_source={form.data_source} potential_saving_gbp={previewCalc.saving} />
              )}
            </>
          )}

          
          <div className="border-t border-border pt-4">
            <label className="text-xs font-medium text-muted-foreground">Carbon Price Deduction (£ GBP)</label>
            <input type="number" step="0.01" value={form.carbon_price_deduction_gbp}
              onChange={(e) => update("carbon_price_deduction_gbp", e.target.value)}
              className="w-full mt-1 px-4 py-2.5 rounded-lg bg-background border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-emerald-500/40"
              placeholder="0" />
            {parseFloat(form.carbon_price_deduction_gbp) > 0 && (
              <>
                <textarea rows={2} value={form.deduction_evidence_note}
                  onChange={(e) => update("deduction_evidence_note", e.target.value)}
                  className="w-full mt-2 px-4 py-2.5 rounded-lg bg-background border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-emerald-500/40"
                  placeholder="Evidence note for carbon price deduction..." />
                <label className="flex items-start gap-2 mt-2 cursor-pointer">
                  <input type="checkbox" checked={form.deduction_confirmed}
                    onChange={(e) => update("deduction_confirmed", e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded bg-background border-border/80 text-emerald-500 focus:ring-emerald-500/40" />
                  <span className="text-xs text-muted-foreground">
                    I confirm this is an <strong className="text-foreground/70">explicit carbon price</strong> (carbon tax or ETS). Implicit costs (energy levies, fuel duties) are not eligible.
                  </span>
                </label>
              </>
            )}
          </div>
        </div>
      )}

      
      {step === 4 && selectedProduct && etsPrice && (
        <div className="space-y-6">
          
          <div className="bg-card shadow-sm rounded-xl border border-border p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Product</span><span className="text-foreground">{selectedProduct.commodity_code} — {selectedProduct.description}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Sector</span><span className="text-foreground capitalize">{selectedProduct.sector}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="text-foreground">{form.import_date}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Quantity</span><span className="text-foreground">{form.quantity_tonnes} tonnes</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Import Value</span><span className="text-foreground">£{parseFloat(form.import_value_gbp || 0).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Country</span><span className="text-foreground">{form.country_of_origin}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="text-foreground capitalize">{form.import_type.replace("_", " ")}</span></div>
          </div>

          
          <FormulaBreakdown
            quantity_tonnes={form.quantity_tonnes}
            emissions_intensity={
              form.data_source !== "default" && form.emissions_intensity_actual
                ? form.emissions_intensity_actual
                : selectedProduct.default_intensity
            }
            emissions_intensity_default={selectedProduct.default_intensity}
            uk_ets_rate={etsPrice.price_gbp}
            carbon_price_deduction_gbp={form.carbon_price_deduction_gbp}
            import_type={form.import_type}
            data_source={form.data_source}
            embedded_emissions_tco2e={previewCalc?.embedded}
            cbam_liability_gbp={previewCalc?.liability}
            cbam_liability_default_gbp={previewCalc?.defaultLiability}
            potential_saving_gbp={previewCalc?.saving}
            is_threshold_exempt={form.import_type === "returned_goods"}
            exemption_reason={form.import_type === "returned_goods" ? "Returned goods — exempt" : null}
          />

          {createMutation.isError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              <AlertTriangle className="w-4 h-4" />
              {createMutation.error?.message || "Failed to create import"}
            </div>
          )}
        </div>
      )}

      
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <button onClick={() => step > 1 ? setStep(step - 1) : navigate("/CBAMManager")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-background transition-all">
          <ArrowLeft className="w-4 h-4" />
          {step > 1 ? "Back" : "Cancel"}
        </button>

        {step < 4 ? (
          <button onClick={() => setStep(step + 1)} disabled={!canNext()}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-all">
            Next
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-500/20">
            {createMutation.isPending ? (
              <div className="w-4 h-4 border-2 border-primary/20 border-t-white rounded-full animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            {createMutation.isPending ? "Saving..." : "Create Import"}
          </button>
        )}
      </div>
    </div>
  );
}
