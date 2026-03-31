import React from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard, ShieldCheck, Activity, FileText, Sparkles,
  LogOut, Leaf, BarChart3, FlaskConical,
} from "lucide-react";
import { createPageUrl } from "@/utils/routes";

const navItems = [
  { name: "Dashboard",       icon: LayoutDashboard, page: "Dashboard" },
  { name: "CBAM Manager",    icon: ShieldCheck,     page: "CBAMManager" },
  { name: "Emissions",       icon: Activity,        page: "Emissions" },
  { name: "Reports",         icon: FileText,        page: "Reports" },
  { name: "AI Insights",     icon: Sparkles,        page: "AIInsights" },
  { name: "Benchmarking",    icon: BarChart3,        page: "Benchmarking" },
  { name: "Scenario Planner",icon: FlaskConical,    page: "ScenarioPlanner" },
];

export default function Sidebar({ collapsed, currentPageName, user, onClose }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 py-6 border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
          <Leaf className="w-5 h-5 text-sidebar-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-base font-bold text-sidebar-accent-foreground tracking-tight">NetZeroWorks</h1>
            <p className="text-[10px] text-sidebar-foreground uppercase tracking-widest">Carbon Platform</p>
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = currentPageName === item.page;
          return (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-sidebar-primary/10 text-sidebar-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <item.icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? "text-sidebar-primary" : ""}`} />
              {!collapsed && <span>{item.name}</span>}
              {isActive && !collapsed && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-sidebar-primary" />}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-4 mt-auto border-t border-sidebar-border pt-4">
        {user && !collapsed && (
          <div className="flex items-center gap-3 px-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-semibold text-sidebar-accent-foreground">
              {user.full_name?.[0] || user.email?.[0]?.toUpperCase() || "U"}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-sidebar-accent-foreground truncate">{user.full_name || "User"}</p>
              <p className="text-[11px] text-sidebar-foreground truncate">{user.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={() => { localStorage.removeItem("access_token"); window.location.href = "/"; }}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors w-full ${collapsed ? "justify-center" : ""}`}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </div>
  );
}
