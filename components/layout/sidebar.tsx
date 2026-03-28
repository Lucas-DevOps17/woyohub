"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { DarkToggle } from "@/components/ui/theme-provider";
import {
  LayoutDashboard,
  BookOpen,
  Sparkles,
  Map,
  FolderKanban,
  Trophy,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/courses", label: "Courses", icon: BookOpen },
  { href: "/skills", label: "Skills", icon: Sparkles },
  { href: "/roadmaps", label: "Roadmaps", icon: Map },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/achievements", label: "Achievements", icon: Trophy },
];

const bottomItems = [
  { href: "/settings", label: "Settings", icon: Settings, danger: false },
  { href: "/signout", label: "Sign Out", icon: LogOut, danger: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navContent = (
    <>
      {/* Brand */}
      <div className="px-6 mb-10">
        <h2 className="font-display text-[22px] font-extrabold text-[var(--on-surface)] tracking-tight">
          WOYOhub
        </h2>
        <p className="text-xs text-[var(--outline)] mt-1 tracking-wide">
          Intellectual Ascent
        </p>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 flex flex-col gap-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-[14px] text-[15px] font-medium transition-all duration-200"
              style={{
                background: isActive
                  ? "var(--primary-dim, #e8f0fe)"
                  : "transparent",
                color: isActive ? "var(--primary)" : "var(--on-surface-variant)",
              }}
            >
              <item.icon
                size={20}
                strokeWidth={1.6}
                color={isActive ? "var(--primary)" : "var(--outline)"}
              />
              <span style={{ fontWeight: isActive ? 700 : 500 }}>
                {item.label}
              </span>
            </a>
          );
        })}
      </nav>

      {/* Bottom nav */}
      <div className="px-3 pb-2 pt-3 flex flex-col gap-0.5" style={{ borderTop: "1px solid var(--outline-variant)" }}>
        {bottomItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-[14px] text-[15px] font-medium transition-all duration-200"
              style={{
                background: isActive
                  ? "var(--primary-dim, #e8f0fe)"
                  : "transparent",
                color: item.danger
                  ? "var(--error)"
                  : isActive
                  ? "var(--primary)"
                  : "var(--on-surface-variant)",
              }}
            >
              <item.icon
                size={20}
                strokeWidth={1.6}
                color={item.danger ? "var(--error)" : isActive ? "var(--primary)" : "var(--outline)"}
              />
              <span style={{ fontWeight: isActive ? 700 : 500 }}>
                {item.label}
              </span>
            </a>
          );
        })}
      </div>

      {/* Dark mode toggle */}
      <div className="px-5 pb-6 pt-3">
        <DarkToggle />
      </div>
    </>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-40 p-2 rounded-xl"
        style={{ background: "var(--surface-low)" }}
      >
        <Menu size={22} color="var(--on-surface-variant)" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)" }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className="lg:hidden fixed inset-y-0 left-0 z-50 w-[260px] flex flex-col pt-8 transition-transform duration-300"
        style={{
          background: "var(--surface)",
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
        }}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-1"
          style={{ color: "var(--outline)" }}
        >
          <X size={20} />
        </button>
        {navContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex fixed inset-y-0 left-0 w-[220px] flex-col pt-8"
        style={{ background: "var(--surface)" }}
      >
        {navContent}
      </aside>
    </>
  );
}
