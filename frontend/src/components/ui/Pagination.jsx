import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Shared pagination footer used by CBAMManager, Reports, Emissions, ImportsListPage.
 *
 * Props:
 *   page         – current page (1-based)
 *   totalPages   – total number of pages
 *   total        – total record count
 *   pageSize     – records per page
 *   onPageChange – (newPage: number) => void
 *   label        – noun for the records, e.g. "imports" | "reports" | "activities"
 */
export default function Pagination({ page, totalPages, total, pageSize, onPageChange, label = "items" }) {
  if (totalPages <= 1) return null;

  const from = total > 0 ? (page - 1) * pageSize + 1 : 0;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="bg-card border border-border rounded-xl px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Showing {from} to {to} of {total} {label}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="inline-flex items-center px-3 py-1.5 border border-border rounded-lg text-xs font-medium hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-background"
          >
            <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Previous
          </button>
          <span className="text-xs font-medium text-muted-foreground px-2">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="inline-flex items-center px-3 py-1.5 border border-border rounded-lg text-xs font-medium hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-background"
          >
            Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
