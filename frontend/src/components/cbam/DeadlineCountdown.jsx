import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";
import { httpFetch } from "@/services/httpClient";

function getDaysUntil(dueDate) {
  const now = new Date();
  const target = new Date(dueDate);
  const diffMs = target.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function getUrgency(days) {
  if (days < 0) return { color: "text-red-600", bg: "bg-red-50 border-red-200", icon: AlertTriangle, label: "Overdue" };
  if (days <= 7) return { color: "text-red-600", bg: "bg-red-50 border-red-200", icon: AlertTriangle, label: "Urgent" };
  if (days <= 30) return { color: "text-amber-600", bg: "bg-amber-50 border-amber-200", icon: Clock, label: "Approaching" };
  return { color: "text-foreground", bg: "bg-card border-border", icon: Calendar, label: "Upcoming" };
}

export default function DeadlineWidget() {
  const { data: deadlines, isLoading } = useQuery({
    queryKey: ["deadlines-next"],
    queryFn: () => httpFetch("/api/deadlines/next"),
    staleTime: 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          UK CBAM Deadlines
        </h3>
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-border border-t-foreground rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!deadlines || deadlines.length === 0) {
    return (
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          UK CBAM Deadlines
        </h3>
        <div className="p-8 text-center text-sm text-muted-foreground">
          No upcoming deadlines
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
        UK CBAM Deadlines
      </h3>

      {deadlines.map((deadline) => {
        const days = getDaysUntil(deadline.due_date);
        const u = getUrgency(days);
        const Icon = u.icon;
        const isOverdue = days < 0;

        return (
          <div
            key={deadline.id}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${u.bg}`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isOverdue ? "bg-red-100" : "bg-white/70"}`}>
              <Icon className={`w-4 h-4 ${u.color}`} />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {deadline.deadline_type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </p>
              <p className="text-[10px] text-muted-foreground">
                Due: {new Date(deadline.due_date).toLocaleDateString("en-GB", { 
                  day: "numeric", 
                  month: "short", 
                  year: "numeric" 
                })}
              </p>
            </div>

            <div className="text-right flex-shrink-0">
              {isOverdue ? (
                <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                  {Math.abs(days)}d overdue
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
        HM Treasury Carbon Border Adjustment Mechanism
      </p>
    </div>
  );
}
