import React, { useState, useEffect } from "react";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import MobileHeader from "@/components/layout/MobileHeader";

const db = globalThis.__B44_DB__

export default function Layout({ children, currentPageName }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    db.auth.me().then(setUser).catch(() => {});
  }, []);

  if (currentPageName === "Onboarding") return <>{children}</>;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300 ${collapsed ? "w-[68px]" : "w-[260px]"} relative flex-shrink-0`}>
        <Sidebar collapsed={collapsed} currentPageName={currentPageName} user={user} />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shadow-sm"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-[260px] h-full bg-sidebar z-50">
            <Sidebar collapsed={false} currentPageName={currentPageName} user={user} onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <main className="flex-1 flex flex-col overflow-hidden">
        <MobileHeader onMenuOpen={() => setMobileOpen(true)} />
        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}
