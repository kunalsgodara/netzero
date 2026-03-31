import React from "react";

export default function Select({ className = "", disabled = false, children, ...props }) {
  return (
    <select
      disabled={disabled}
      className={`themed-select ${className}`}
      style={{
        width: '100%',
        padding: '0.5rem 2rem 0.5rem 0.75rem',
        fontSize: '0.875rem',
        borderRadius: '0.5rem',
        border: '1px solid hsl(var(--border))',
        backgroundColor: 'hsl(var(--background))',
        color: 'hsl(var(--foreground))',
        appearance: 'none',
        WebkitAppearance: 'none',
        MozAppearance: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        backgroundImage: disabled ? 'none' : `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2316a34a' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 0.625rem center',
        opacity: disabled ? 0.6 : 1,
      }}
      {...props}
    >
      {children}
    </select>
  );
}
