import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Calculator, Search, ArrowRight, ArrowLeft, Save, RotateCcw, Info } from "lucide-react";
import { cbamApi } from "@/services/cbamApiService";
import FormulaBreakdown from "@/components/cbam/FormulaBreakdown";
import SavingsCallout from "@/components/cbam/SavingsCallout";
import { toast } from "sonner";

const COUNTRIES = [
  "China", "India", "Turkey", "Russia", "Ukraine", "Brazil", "South Africa",
  "Vietnam", "Indonesia", "Thailand", "Malaysia", "Egypt", "Saudi Arabia",
  "South Korea", "Japan", "Taiwan", "United States", "Germany", "France", "Other",
];

export default function UKCBAMCalculator() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const [form, setForm] = useState({
    product_id: "",
    import_date: new Date().toISOString().split("T")[0],
    import_value_gbp: "",
    quantity_tonnes: "",
    country_of_origin: "",
    import_type: "standard",
    data_source: "default",
    emissions_intensity_actual: "",
    carbon_price_deduction_gbp: "0",
  });

  // Fetch products
  const { data: products } = useQuery({
    queryKey: ["cbam-products"],
    queryFn: () => cbamApi.getProducts(),
    staleTime: 10 * 60 * 1000,
  });

  // Fetch current ETS price
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
      (p) =>
        p.commodity_code.includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.sector.includes(q)
    );
  }, [products, searchTerm]);

  // Calculate liability in real-time
  const calculation = useMemo(() => {
    if (!selectedProduct || !etsPrice || !form.quantity_tonnes) return null;

    const qty = parseFloat(form.quantity_tonnes) || 0;
    const intensityDefault = parseFloat(selectedProduct.default_intensity);
    const intensity =
      form.data_source !== "default" && form.emissions_intensity_actual
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

  // Save as import mutation
  const saveAsImportMutation = useMutation({
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
        emissions_intensity_actual:
          form.data_source !== "default" && form.emissions_intensity_actual
            ? parseFloat(form.emissions_intensity_actual)
            : null,
      };
      return cbamApi.createImport(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cbam-imports"] });
      toast.success("Import record created successfully");
      navigate("/CBAMManager");
    },
    onError: () => {
      toast.error("Failed to create import record");
    },
  });

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const resetCalculator = () => {
    setForm({
      product_id: "",
      import_date: new Date().toISOString().split("T")[0],
      import_value_gbp: "",
      quantity_tonnes: "",
      country_of_origin: "",
      import_type: "standard",
      data_source: "default",
      emissions_intensity_actual: "",
      carbon_price_deduction_gbp: "0",
    });
    setStep(1);
    setSearchTerm("");
  };

  const canProceed = () => {
    if (step === 1) return !!form.product_id;
    if (step === 2)
      return (
        form.quantity_tonnes &&
        form.country_of_origin &&
        form.import_value_gbp
      );
    return true;
  };

  const gbp = (val) =>
    `£${parseFloat(val || 0).toLocaleString("en-GB", {
      minimumFractionDigits: 2,
    })}`;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/CBAMManager")}
          className="p-2 rounded-lg bg-background hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Calculator className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              UK CBAM Calculator
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Estimate CBAM liability without creating an import record
            </p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex gap-1">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`flex-1 h-1.5 rounded-full transition-all ${
              s <= step ? "bg-emerald-500" : "bg-muted"
            }`}
          />
        ))}
      </div>

      {/* Step 1: Product Selection */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
              <input
                type="text"
                placeholder="Search by commodity code, description, or sector..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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

      {/* Step 2: Import Details */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Quantity (tonnes)
              </label>
              <input
                type="number"
                step="0.01"
                value={form.quantity_tonnes}
                onChange={(e) => update("quantity_tonnes", e.target.value)}
                className="w-full mt-1 px-4 py-2.5 rounded-lg bg-background border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-emerald-500/40"
                placeholder="e.g. 100"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Import Value (£ GBP)
              </label>
              <input
                type="number"
                step="0.01"
                value={form.import_value_gbp}
                onChange={(e) => update("import_value_gbp", e.target.value)}
                className="w-full mt-1 px-4 py-2.5 rounded-lg bg-background border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-emerald-500/40"
                placeholder="e.g. 25000"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Country of Origin
            </label>
            <select
              value={form.country_of_origin}
              onChange={(e) => update("country_of_origin", e.target.value)}
              className="w-full mt-1 px-4 py-2.5 rounded-lg bg-background border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-emerald-500/40"
            >
              <option value="">Select country...</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Import Type
            </label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {[
                { val: "standard", label: "Standard" },
                { val: "outward_processing", label: "Outward Processing" },
                { val: "returned_goods", label: "Returned Goods" },
              ].map((t) => (
                <button
                  key={t.val}
                  onClick={() => update("import_type", t.val)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    form.import_type === t.val
                      ? "bg-emerald-500/10 border-emerald-500/30"
                      : "bg-card border-border hover:bg-muted/50"
                  }`}
                >
                  <p className="text-sm font-medium text-foreground">
                    {t.label}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Emissions Data & Calculation */}
      {step === 3 && selectedProduct && etsPrice && (
        <div className="space-y-6">
          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Data Source
            </label>
            <div className="grid grid-cols-3 gap-2 mt-1">
              {[
                { val: "default", label: "Default" },
                { val: "actual_unverified", label: "Actual (Unverified)" },
                { val: "actual_verified", label: "Actual (Verified)" },
              ].map((t) => (
                <button
                  key={t.val}
                  onClick={() => update("data_source", t.val)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    form.data_source === t.val
                      ? "bg-emerald-500/10 border-emerald-500/30"
                      : "bg-card border-border hover:bg-muted/50"
                  }`}
                >
                  <p className="text-sm font-medium text-foreground">
                    {t.label}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {form.data_source !== "default" && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Actual Emission Intensity (tCO₂e/tonne)
              </label>
              <input
                type="number"
                step="0.0001"
                value={form.emissions_intensity_actual}
                onChange={(e) =>
                  update("emissions_intensity_actual", e.target.value)
                }
                className="w-full mt-1 px-4 py-2.5 rounded-lg bg-background border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-emerald-500/40"
                placeholder={`Default: ${selectedProduct.default_intensity}`}
              />
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-muted-foreground">
              Carbon Price Deduction (£ GBP)
            </label>
            <input
              type="number"
              step="0.01"
              value={form.carbon_price_deduction_gbp}
              onChange={(e) =>
                update("carbon_price_deduction_gbp", e.target.value)
              }
              className="w-full mt-1 px-4 py-2.5 rounded-lg bg-background border border-border text-sm text-foreground outline-none focus:ring-2 focus:ring-emerald-500/40"
              placeholder="0"
            />
          </div>

          {/* Live Calculation Results */}
          {calculation && (
            <>
              <FormulaBreakdown
                quantity_tonnes={form.quantity_tonnes}
                emissions_intensity={calculation.intensity}
                emissions_intensity_default={selectedProduct.default_intensity}
                uk_ets_rate={etsPrice.price_gbp}
                carbon_price_deduction_gbp={form.carbon_price_deduction_gbp}
                import_type={form.import_type}
                data_source={form.data_source}
                embedded_emissions_tco2e={calculation.embedded}
                cbam_liability_gbp={calculation.liability}
                cbam_liability_default_gbp={calculation.defaultLiability}
                potential_saving_gbp={calculation.saving}
                is_threshold_exempt={form.import_type === "returned_goods"}
                exemption_reason={
                  form.import_type === "returned_goods"
                    ? "Returned goods — exempt"
                    : null
                }
              />

              {parseFloat(calculation.saving) > 0 && (
                <SavingsCallout
                  data_source={form.data_source}
                  potential_saving_gbp={calculation.saving}
                />
              )}
            </>
          )}
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <button
          onClick={() => (step > 1 ? setStep(step - 1) : navigate("/CBAMManager"))}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-background transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          {step > 1 ? "Back" : "Cancel"}
        </button>

        <div className="flex items-center gap-2">
          {step === 3 && (
            <>
              <button
                onClick={resetCalculator}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-background transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                Calculate Another
              </button>
              <button
                onClick={() => saveAsImportMutation.mutate()}
                disabled={saveAsImportMutation.isPending}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all"
              >
                {saveAsImportMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save as Import
              </button>
            </>
          )}

          {step < 3 && (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-all"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
