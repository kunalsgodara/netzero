/**
 * DeadlineCountdown — Section 6.6
 * Dashboard widget with hard-coded UK CBAM milestone dates and live day countdown.
 *
 * Three milestones:
 *   - CBAM go-live (1 Jan 2027)
 *   - First annual return (31 May 2028)
 *   - Indirect emissions inclusion (1 Jan 2029)
 *
 * Each with days remaining and a colour-coded urgency indicator.
 */
import { Calendar, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

const MILESTONES = [
  {
    label: "UK CBAM Go-Live",
    date: new Date("2027-01-01"),
    description: "Registration, reporting and payment obligations begin",
  },
  {
    label: "First Annual Return Due",
    date: new Date("2028-05-31"),
    description: "Annual declaration for 2027 import year",
  },
  {
    label: "Indirect Emissions Included",
    date: new Date("2029-01-01"),
    description: "Scope 2 (indirect) emissions added to calculations",
  },
];

function getDaysUntil(target) {
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function getUrgency(days) {
  if (days <= 0) return { color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", icon: CheckCircle2, label: "Live" };
  if (days <= 90) return { color: "text-red-600", bg: "bg-red-50 border-red-200", icon: AlertTriangle, label: "Urgent" };
  if (days <= 365) return { color: "text-amber-600", bg: "bg-amber-50 border-amber-200", icon: Clock, label: "Approaching" };
  return { color: "text-foreground", bg: "bg-card border-border", icon: Calendar, label: "" };
}

export default function DeadlineCountdown() {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
        UK CBAM Milestones
      </h3>

      {MILESTONES.map((m) => {
        const days = getDaysUntil(m.date);
        const u = getUrgency(days);
        const Icon = u.icon;
        const isPast = days <= 0;

        return (
          <div
            key={m.label}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${u.bg}`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isPast ? "bg-emerald-100" : "bg-white/70"}`}>
              <Icon className={`w-4 h-4 ${u.color}`} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{m.label}</p>
              <p className="text-[10px] text-muted-foreground truncate">{m.description}</p>
            </div>

            <div className="text-right flex-shrink-0">
              {isPast ? (
                <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                  ✓ Active
                </span>
              ) : (
                <>
                  <p className={`text-lg font-bold tabular-nums ${u.color}`}>{days}</p>
                  <p className="text-[10px] text-muted-foreground">days</p>
                </>
              )}
            </div>
          </div>
        );
      })}

      <p className="text-[10px] text-muted-foreground/60 text-center pt-1">
        Dates per HM Treasury Carbon Border Adjustment Mechanism
      </p>
    </div>
  );
}
