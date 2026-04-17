import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Search } from "lucide-react";


export default function SearchableSelect({
  value = "",
  onChange,
  options = [],
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  disabled = false,
  className = "",
  hasError = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);
  const searchRef = useRef(null);

  
  useEffect(() => {
    if (open && searchRef.current) {
      searchRef.current.focus();
    }
  }, [open]);

  
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => o.value === value);

  const filtered = query.trim()
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(query.toLowerCase()) ||
          (o.sublabel || "").toLowerCase().includes(query.toLowerCase())
      )
    : options;

  const handleSelect = (optValue) => {
    onChange(optValue);
    setOpen(false);
    setQuery("");
  };

  const toggle = () => {
    if (!disabled) {
      setOpen((o) => !o);
      if (open) setQuery("");
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`} style={{ userSelect: "none" }}>
      
      <button
        type="button"
        disabled={disabled}
        onClick={toggle}
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
            animation: "ssDropdown 0.15s ease",
          }}
        >
          
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              padding: "0.375rem 0.5rem",
              marginBottom: "0.25rem",
              borderBottom: "1px solid hsl(214.3 31.8% 91.4%)",
            }}
          >
            <Search style={{ width: 13, height: 13, color: "hsl(215.4 16.3% 46.9%)", flexShrink: 0 }} />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: "0.8125rem",
                color: "hsl(222.2 84% 4.9%)",
                backgroundColor: "transparent",
              }}
            />
          </div>

          
          <div style={{ maxHeight: "220px", overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "0.5rem 0.75rem", fontSize: "0.8rem", color: "hsl(215.4 16.3% 46.9%)" }}>
                No results found
              </div>
            ) : (
              filtered.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <SSItem
                    key={opt.value}
                    label={opt.label}
                    sublabel={opt.sublabel}
                    isSelected={isSelected}
                    onSelect={() => handleSelect(opt.value)}
                  />
                );
              })
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes ssDropdown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ss-item:hover {
          background-color: hsl(142 64% 34% / 0.08) !important;
          color: hsl(142 64% 25%) !important;
          border-color: hsl(142 64% 34% / 0.5) !important;
        }
      `}</style>
    </div>
  );
}

function SSItem({ label, sublabel, isSelected, onSelect }) {
  return (
    <button
      type="button"
      className="ss-item"
      onClick={onSelect}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100%",
        padding: "0.4rem 0.75rem",
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
      <span style={{ flex: 1, overflow: "hidden" }}>
        <span style={{ display: "block", fontFamily: "monospace", fontSize: "0.8rem" }}>{label}</span>
        {sublabel && (
          <span style={{ display: "block", fontSize: "0.7rem", color: "hsl(215.4 16.3% 55%)", marginTop: "1px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {sublabel}
          </span>
        )}
      </span>
      {isSelected && (
        <Check style={{ width: 13, height: 13, color: "hsl(142 64% 34%)", flexShrink: 0, marginLeft: "0.5rem" }} />
      )}
    </button>
  );
}
