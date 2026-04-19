
import { TrendingDown, AlertTriangle } from "lucide-react";

export default function SavingsCallout({ data_source, potential_saving_gbp }) {
  if (data_source === "default" || !potential_saving_gbp) return null;

  const saving = parseFloat(potential_saving_gbp);
  if (saving <= 0) return null;

  const isVerified = data_source === "actual_verified";

  if (isVerified) {
    return (
      <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
        <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
          <TrendingDown className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-emerald-300">
            💰 By using verified actual data for this import,
          </p>
          <p className="text-sm text-emerald-400 mt-0.5">
            you save <span className="font-bold text-emerald-300">£{saving.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</span> vs default values.
          </p>
        </div>
      </div>
    );
  }

  
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
      <div className="w-9 h-9 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
        <AlertTriangle className="w-5 h-5 text-amber-400" />
      </div>
      <div>
        <p className="text-sm font-semibold text-amber-300">
          Potential saving: £{saving.toLocaleString('en-GB', { minimumFractionDigits: 2 })} vs default
        </p>
        <p className="text-xs text-amber-400/80 mt-1">
          Get this data verified to use in your official CBAM declaration.
        </p>
      </div>
    </div>
  );
}
