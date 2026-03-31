import React from "react";
import { Leaf, Menu } from "lucide-react";

export default function MobileHeader({ onMenuOpen }) {
  return (
    <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-card">
      <button onClick={onMenuOpen} className="p-2 hover:bg-muted rounded-lg">
        <Menu className="w-5 h-5" />
      </button>
      <div className="flex items-center gap-2">
        <Leaf className="w-5 h-5 text-primary" />
        <span className="font-bold text-sm">NetZeroWorks</span>
      </div>
      <div className="w-9" />
    </div>
  );
}
