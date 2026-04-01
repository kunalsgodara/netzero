import React from "react";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";

export default function KPICard({ title, value, subtitle, icon: Icon, trend, iconBg }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-1 truncate">{value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
        {Icon && (
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ml-3 ${iconBg || "bg-primary/10"}`}>
            <Icon className="w-4 h-4 text-primary" />
          </div>
        )}
      </div>
      {trend !== null && trend !== undefined ? (
        <p className={`text-xs mt-2 font-medium flex items-center gap-1 ${
          trend < 0 ? "text-green-600" : trend > 0 ? "text-red-500" : "text-muted-foreground"
        }`}>
          {trend < 0 ? <TrendingDown className="w-3 h-3" /> : trend > 0 ? <TrendingUp className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          {trend > 0 ? "+" : ""}{trend}% vs last quarter
        </p>
      ) : (
        <p className="text-xs mt-2 text-muted-foreground flex items-center gap-1">
          <Minus className="w-3 h-3" /> No prior quarter data
        </p>
      )}
    </div>
  );
}

