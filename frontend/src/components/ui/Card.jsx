/**
 * Shared card wrapper. Replaces the repeated:
 *   className="bg-card border border-border rounded-xl p-5"
 * pattern across 20+ locations.
 *
 * Props:
 *   padding   – "sm" (p-4) | "md" (p-5, default) | "none"
 *   shadow    – adds shadow-sm when true (default true)
 *   className – additional classes
 */
export default function Card({ children, padding = "md", shadow = true, className = "", ...props }) {
  const padClass = padding === "none" ? "" : padding === "sm" ? "p-4" : "p-5";
  const shadowClass = shadow ? "shadow-sm" : "";
  return (
    <div
      className={`bg-card border border-border rounded-xl ${padClass} ${shadowClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * Small stat card used on UKCBAMProducts, Dashboard summary rows, etc.
 *
 * Props:
 *   label     – uppercase label text
 *   value     – main value
 *   valueClass – extra class on the value (e.g. "text-emerald-400")
 */
export function StatCard({ label, value, valueClass = "text-foreground" }) {
  return (
    <div className="bg-card shadow-sm border border-border rounded-xl p-4">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${valueClass}`}>{value}</p>
    </div>
  );
}
