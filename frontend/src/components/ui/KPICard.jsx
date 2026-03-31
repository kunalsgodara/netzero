import React from "react";

export default function KPICard({ title, value, subtitle, icon: Icon, trend }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
        {Icon && (
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-4 h-4 text-primary" />
          </div>
        )}
      </div>
      {trend !== undefined && (
        <p className={`text-xs mt-2 font-medium ${trend < 0 ? "text-green-600" : "text-red-500"}`}>
          {trend > 0 ? "+" : ""}{trend}% vs last quarter
        </p>
      )}
    </div>
  );
}
