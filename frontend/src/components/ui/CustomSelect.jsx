import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

/**
 * CustomSelect – a fully styled dropdown that replaces the native <select>.
 *
 * Props:
 *   value        – currently selected value (string)
 *   onChange     – called with the new value string (NOT an event object)
 *   options      – array of { value, label } objects
 *   placeholder  – text shown when nothing is selected
 *   disabled     – boolean
 *   className    – extra classes for the trigger button
 */
export default function CustomSelect({
  value = "",
  onChange,
  options = [],
  placeholder = "Select...",
  disabled = false,
  className = "",
  hasError = false,
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => o.value === value);

  const handleSelect = (optValue) => {
    onChange(optValue);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`} style={{ userSelect: "none" }}>
      {/* ── Trigger Button ─────────────────────────────────────── */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.5rem 0.75rem",
          fontSize: "0.875rem",
          borderRadius: "0.5rem",
          border: open
            ? "1px solid hsl(142 64% 34%)"
            : hasError
            ? "1px solid hsl(0 72% 51%)"
            : "1px solid hsl(214.3 31.8% 91.4%)",
          backgroundColor: disabled ? "hsl(210 40% 96.1% / 0.5)" : "hsl(0 0% 100%)",
          color: selected ? "hsl(222.2 84% 4.9%)" : "hsl(215.4 16.3% 46.9%)",
          cursor: disabled ? "not-allowed" : "pointer",
          outline: "none",
          boxShadow: open ? "0 0 0 3px hsl(142 64% 34% / 0.15)" : hasError ? "0 0 0 3px hsl(0 72% 51% / 0.12)" : "none",
          transition: "border-color 0.15s, box-shadow 0.15s",
          opacity: disabled ? 0.6 : 1,
          textAlign: "left",
        }}
      >
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          style={{
            width: 14,
            height: 14,
            flexShrink: 0,
            marginLeft: "0.5rem",
            color: "hsl(142 64% 34%)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        />
      </button>

      {/* ── Dropdown Panel ─────────────────────────────────────── */}
      {open && (
        <div
          style={{
            position: "absolute",
            zIndex: 50,
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            backgroundColor: "hsl(0 0% 100%)",
            border: "1px solid hsl(214.3 31.8% 91.4%)",
            borderRadius: "0.75rem",
            boxShadow: "0 8px 30px rgba(0,0,0,0.10)",
            padding: "0.375rem",
            maxHeight: "240px",
            overflowY: "auto",
            animation: "csDropdown 0.15s ease",
          }}
        >
          {options.length === 0 ? (
            <div style={{ padding: "0.5rem 0.75rem", fontSize: "0.8rem", color: "hsl(215.4 16.3% 46.9%)" }}>
              No options available
            </div>
          ) : (
            options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <DropdownItem
                  key={opt.value}
                  label={opt.label}
                  isSelected={isSelected}
                  onSelect={() => handleSelect(opt.value)}
                />
              );
            })
          )}
        </div>
      )}

      <style>{`
        @keyframes csDropdown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .cs-item:hover {
          background-color: hsl(142 64% 34% / 0.08) !important;
          color: hsl(142 64% 25%) !important;
          border-color: hsl(142 64% 34% / 0.5) !important;
        }
      `}</style>
    </div>
  );
}

function DropdownItem({ label, isSelected, onSelect }) {
  return (
    <button
      type="button"
      className="cs-item"
      onClick={onSelect}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        padding: "0.45rem 0.75rem",
        fontSize: "0.875rem",
        borderRadius: "0.5rem",
        border: "1px solid transparent",
        backgroundColor: isSelected ? "hsl(142 64% 34% / 0.1)" : "transparent",
        color: isSelected ? "hsl(142 64% 25%)" : "hsl(222.2 84% 4.9%)",
        cursor: "pointer",
        textAlign: "left",
        marginBottom: "2px",
        transition: "background-color 0.12s, color 0.12s, border-color 0.12s",
        fontWeight: isSelected ? 600 : 400,
      }}
    >
      <span style={{ flex: 1 }}>{label}</span>
      {isSelected && (
        <Check style={{ width: 13, height: 13, color: "hsl(142 64% 34%)", flexShrink: 0 }} />
      )}
    </button>
  );
}
