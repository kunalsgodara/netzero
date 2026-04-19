
import DataSourceBadge from "./DataSourceBadge";
import SavingsCallout from "./SavingsCallout";

function fmt(val, decimals = 2) {
  const n = parseFloat(val || 0);
  return n.toLocaleString("en-GB", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
function gbp(val) {
  return `£${fmt(val)}`;
}

export default function FormulaBreakdown({
  quantity_tonnes,
  emissions_intensity,
  emissions_intensity_default,
  uk_ets_rate,
  carbon_price_deduction_gbp = 0,
  import_type,
  data_source,
  embedded_emissions_tco2e,
  cbam_liability_gbp,
  cbam_liability_default_gbp,
  potential_saving_gbp,
  is_threshold_exempt,
  exemption_reason,
}) {
  const qty = parseFloat(quantity_tonnes || 0);
  const intensity = parseFloat(emissions_intensity || emissions_intensity_default || 0);
  const intensityDefault = parseFloat(emissions_intensity_default || 0);
  const etsRate = parseFloat(uk_ets_rate || 0);
  const deduction = parseFloat(carbon_price_deduction_gbp || 0);
  const deductionTco2e = etsRate > 0 ? deduction / etsRate : 0;
  const embedded = parseFloat(embedded_emissions_tco2e || qty * intensity);
  const netEmissions = Math.max(0, embedded - deductionTco2e);

  const isReturned = import_type === "returned_goods";

  return (
    <div className="space-y-4">
      
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground/80 uppercase tracking-wider">Formula Breakdown</h3>
        <DataSourceBadge source={data_source} />
      </div>

      
      {isReturned && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <span className="text-lg">🔄</span>
          <div>
            <p className="text-sm font-semibold text-blue-300">Returned Goods — Exempt</p>
            <p className="text-xs text-blue-400/80">{exemption_reason || "Re-imported within 3 years, unaltered."}</p>
          </div>
        </div>
      )}

      
      <div className="space-y-3 bg-card shadow-sm rounded-xl p-4 border border-border/50">
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Quantity</span>
          <span className="font-mono text-foreground">{fmt(qty, 1)} tonnes</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">× Emission Intensity</span>
          <span className="font-mono text-foreground">{fmt(intensity, 4)} tCO₂e/t</span>
        </div>
        {data_source !== "default" && (
          <div className="flex items-center justify-between text-xs pl-4">
            <span className="text-muted-foreground/70">(default would be {fmt(intensityDefault, 4)})</span>
          </div>
        )}
        <div className="border-t border-border pt-2 flex items-center justify-between text-sm">
          <span className="text-foreground/70 font-medium">= Embedded Emissions</span>
          <span className="font-mono font-semibold text-foreground">{fmt(embedded, 4)} tCO₂e</span>
        </div>

        
        {deduction > 0 && (
          <>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-muted-foreground">− Carbon Price Deduction</span>
              <span className="font-mono text-foreground">{gbp(deduction)} ÷ {gbp(etsRate)}/t = {fmt(deductionTco2e, 4)} tCO₂e</span>
            </div>
            <div className="border-t border-border pt-2 flex items-center justify-between text-sm">
              <span className="text-foreground/70 font-medium">= Net Emissions</span>
              <span className="font-mono font-semibold text-foreground">{fmt(netEmissions, 4)} tCO₂e</span>
            </div>
          </>
        )}

        
        <div className="flex items-center justify-between text-sm mt-2">
          <span className="text-muted-foreground">× UK ETS Rate</span>
          <span className="font-mono text-foreground">{gbp(etsRate)}/tCO₂e</span>
        </div>
        <div className="border-t border-border pt-3 flex items-center justify-between">
          <span className="text-foreground font-bold">CBAM Liability</span>
          <span className={`text-lg font-bold font-mono ${isReturned ? 'text-blue-400' : 'text-emerald-400'}`}>
            {isReturned ? "£0.00 (exempt)" : gbp(cbam_liability_gbp)}
          </span>
        </div>
      </div>

      
      {cbam_liability_default_gbp && !isReturned && (
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
            <p className="text-[10px] text-amber-400/80 uppercase tracking-wider font-bold">Default Cost</p>
            <p className="text-lg font-bold text-amber-300 mt-1">{gbp(cbam_liability_default_gbp)}</p>
          </div>
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
            <p className="text-[10px] text-emerald-400/80 uppercase tracking-wider font-bold">Actual Cost</p>
            <p className="text-lg font-bold text-emerald-300 mt-1">{gbp(cbam_liability_gbp)}</p>
          </div>
        </div>
      )}

      
      <SavingsCallout data_source={data_source} potential_saving_gbp={potential_saving_gbp} />

      
      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-card border border-border/50 text-[11px] text-muted-foreground/70">
        <span>ℹ️</span>
        <span>Indirect emissions excluded — included from 2029 per UK CBAM regulations.</span>
      </div>
    </div>
  );
}
