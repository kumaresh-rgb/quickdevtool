"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, PanelLeftClose, PanelLeft } from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/cn";

function NavList({
  collapsed,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            title={item.label}
            className={cn(
              "group flex items-center gap-3 rounded-lg py-2 text-sm transition-colors",
              collapsed ? "justify-center px-2" : "px-2.5",
              active
                ? "bg-accent-soft text-accent"
                : "text-fg-muted hover:bg-bg-card hover:text-fg"
            )}
          >
            <Icon size={18} className="shrink-0" />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand({ collapsed }: { collapsed?: boolean }) {
  return (
    <Link
      href="/"
      className={cn(
        "flex items-center gap-3 px-1 text-xl font-bold",
        collapsed && "justify-center"
      )}
    >
      <Image src="/logo-icon.png" alt="Quick Dev Tools" width={32} height={32} />
      {!collapsed && <span>Quick Dev Tools</span>}
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg md:flex-row">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden shrink-0 flex-col border-r border-border bg-bg-elevated px-3 py-4 transition-all duration-200 md:flex",
          collapsed ? "w-16" : "w-60"
        )}
      >
        <div className={cn("mb-6", collapsed && "flex justify-center")}>
          <Brand collapsed={collapsed} />
        </div>

        <NavList collapsed={collapsed} />

        <div
          className={cn(
            "mt-4 flex items-center px-1",
            collapsed ? "flex-col gap-3" : "justify-between"
          )}
        >
          {!collapsed && <span className="text-xs text-fg-subtle">Local-first</span>}
          <ThemeToggle />
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="btn btn-ghost p-1.5 text-fg-subtle"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="flex items-center justify-between border-b border-border bg-bg-elevated px-4 py-2.5 md:hidden">
        <button
          onClick={() => setDrawerOpen(true)}
          className="btn btn-ghost p-2"
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>
        <Brand />
        <ThemeToggle />
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col border-r border-border bg-bg-elevated px-3 py-4 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <Brand />
              <button
                onClick={() => setDrawerOpen(false)}
                className="btn btn-ghost p-2"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>
            <NavList onNavigate={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}

      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
