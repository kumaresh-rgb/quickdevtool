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
    <nav className="flex flex-1 flex-col gap-0.5">
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
              "group flex items-center gap-2.5 rounded-md py-1.5 text-sm transition-colors",
              collapsed ? "justify-center px-2" : "px-2.5",
              active
                ? "bg-accent-soft font-medium text-accent"
                : "text-fg-muted hover:bg-bg-card hover:text-fg"
            )}
          >
            <Icon size={16} className="shrink-0" />
            {!collapsed && <span className="truncate text-[13px]">{item.label}</span>}
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
        "flex items-center gap-2 px-1",
        collapsed && "justify-center"
      )}
    >
      <Image src="/logo-icon.png" alt="Quick Dev Tools" width={20} height={20} />
      {!collapsed && (
        <span className="text-[13px] font-medium text-fg">Quick Dev Tools</span>
      )}
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
          "hidden shrink-0 flex-col border-r border-border bg-bg-elevated py-3 transition-all duration-200 md:flex",
          collapsed ? "w-14 px-2" : "w-56 px-2.5"
        )}
      >
        {/* Brand */}
        <div className={cn("mb-4 px-1", collapsed && "flex justify-center px-0")}>
          <Brand collapsed={collapsed} />
        </div>

        <NavList collapsed={collapsed} />

        {/* Bottom actions */}
        <div
          className={cn(
            "mt-3 flex items-center border-t border-border pt-3",
            collapsed ? "flex-col gap-2 px-0" : "justify-between px-1"
          )}
        >
          <ThemeToggle />
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="btn btn-ghost p-1.5 text-fg-subtle"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeft size={15} /> : <PanelLeftClose size={15} />}
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="flex items-center justify-between border-b border-border bg-bg-elevated px-3 py-2 md:hidden">
        <button
          onClick={() => setDrawerOpen(true)}
          className="btn btn-ghost p-1.5"
          aria-label="Open menu"
        >
          <Menu size={17} />
        </button>
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo-icon.png" alt="Quick Dev Tools" width={18} height={18} />
          <span className="text-[13px] font-medium">Quick Dev Tools</span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-56 flex-col border-r border-border bg-bg-elevated px-2.5 py-3 shadow-2xl">
            <div className="mb-4 flex items-center justify-between px-1">
              <Brand />
              <button
                onClick={() => setDrawerOpen(false)}
                className="btn btn-ghost p-1.5"
                aria-label="Close menu"
              >
                <X size={16} />
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
