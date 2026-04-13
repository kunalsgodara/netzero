/**
 * DataSourceBadge — Colour-coded pill badge (Section 6.3)
 * default → amber, actual_unverified → blue, actual_verified → green
 */
export default function DataSourceBadge({ source }) {
  const config = {
    default: {
      bg: "bg-amber-500/15 border-amber-500/30",
      text: "text-amber-400",
      label: "DEFAULT VALUES",
      dot: "bg-amber-400",
    },
    actual_unverified: {
      bg: "bg-blue-500/15 border-blue-500/30",
      text: "text-blue-400",
      label: "ACTUAL — UNVERIFIED",
      dot: "bg-blue-400",
    },
    actual_verified: {
      bg: "bg-emerald-500/15 border-emerald-500/30",
      text: "text-emerald-400",
      label: "ACTUAL — VERIFIED ✓",
      dot: "bg-emerald-400",
    },
  };

  const c = config[source] || config.default;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}
