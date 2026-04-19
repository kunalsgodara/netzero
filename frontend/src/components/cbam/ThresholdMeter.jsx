
export default function ThresholdMeter({ current_gbp = 0, threshold_gbp = 50000 }) {
  const current = parseFloat(current_gbp) || 0;
  const threshold = parseFloat(threshold_gbp) || 50000;
  const pct = threshold > 0 ? (current / threshold) * 100 : 0;
  const clampedPct = Math.min(pct, 100);
  const remaining = Math.max(0, threshold - current);

  
  const size = 160;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (clampedPct / 100) * circumference;

  let ringColor, bgRingColor, statusLabel, statusDesc, textColor;

  if (pct >= 100) {
    ringColor = "stroke-red-500";
    bgRingColor = "stroke-red-100";
    textColor = "text-red-600";
    statusLabel = "Exceeded";
    statusDesc = "UK CBAM compliance required";
  } else if (pct >= 60) {
    ringColor = "stroke-amber-500";
    bgRingColor = "stroke-amber-100";
    textColor = "text-amber-600";
    statusLabel = "Approaching";
    statusDesc = `£${remaining.toLocaleString("en-GB", { maximumFractionDigits: 0 })} until compliance required`;
  } else {
    ringColor = "stroke-emerald-500";
    bgRingColor = "stroke-emerald-100";
    textColor = "text-emerald-600";
    statusLabel = "Below threshold";
    statusDesc = `£${remaining.toLocaleString("en-GB", { maximumFractionDigits: 0 })} remaining`;
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" strokeWidth={stroke}
            className={bgRingColor}
          />
          
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className={`${ringColor} transition-all duration-700 ease-out`}
          />
        </svg>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold ${textColor}`}>{pct.toFixed(0)}%</span>
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
            of £{(threshold / 1000).toFixed(0)}k
          </span>
        </div>
      </div>

      <div className="text-center">
        <p className={`text-sm font-semibold ${textColor}`}>{statusLabel}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{statusDesc}</p>
      </div>

      
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>
          Import value: <span className="font-semibold text-foreground">
            £{current.toLocaleString("en-GB", { minimumFractionDigits: 2 })}
          </span>
        </span>
      </div>
    </div>
  );
}
