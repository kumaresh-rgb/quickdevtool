"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/cn";

function NavList({ onNavigate }: { onNavigate?: () => void }) {
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
              "group flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors",
              active ? "bg-accent-soft text-accent" : "text-fg-muted hover:bg-bg-card hover:text-fg"
            )}
          >
            <Icon size={18} className="shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-3 px-1 text-xl font-bold">
      <Image src="/logo-icon.png" alt="Quick Dev Tools" width={36} height={36} />
      <span>Quick Dev Tools</span>
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg md:flex-row">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-bg-elevated px-3 py-4 md:flex">
        <div className="mb-6">
          <Brand />
        </div>
        <NavList />
        <div className="mt-4 flex items-center justify-between px-1">
          <span className="text-xs text-fg-subtle">Local-first</span>
          <ThemeToggle />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="flex items-center justify-between border-b border-border bg-bg-elevated px-4 py-2.5 md:hidden">
        <button onClick={() => setDrawerOpen(true)} className="btn btn-ghost p-2" aria-label="Open menu">
          <Menu size={18} />
        </button>
        <Brand />
        <ThemeToggle />
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-64 flex-col border-r border-border bg-bg-elevated px-3 py-4 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <Brand />
              <button onClick={() => setDrawerOpen(false)} className="btn btn-ghost p-2" aria-label="Close menu">
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
