import { useState, useCallback } from "react";
import { CheckCircle2, XCircle, AlertTriangle, X } from "lucide-react";

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(p => p.filter(t => t.id !== id));
  }, []);

  return { toasts, toast, removeToast };
}

const STYLES = {
  success: { cls: "bg-green-50 border-green-200", Icon: CheckCircle2, ic: "text-green-500", tc: "text-green-800" },
  error:   { cls: "bg-red-50 border-red-200",     Icon: XCircle,       ic: "text-red-500",   tc: "text-red-800"   },
  warning: { cls: "bg-amber-50 border-amber-200", Icon: AlertTriangle,  ic: "text-amber-500", tc: "text-amber-800" },
};

export function ToastContainer({ toasts, onRemove }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 w-80 pointer-events-none">
      {toasts.map(({ id, message, type }) => {
        const s = STYLES[type] || STYLES.success;
        return (
          <div
            key={id}
            className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg pointer-events-auto ${s.cls}`}
            style={{ animation: "toastIn 0.2s ease" }}
          >
            <s.Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${s.ic}`} />
            <p className={`text-sm flex-1 leading-snug ${s.tc}`}>{message}</p>
            <button
              onClick={() => onRemove(id)}
              className="opacity-40 hover:opacity-100 transition-opacity mt-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
