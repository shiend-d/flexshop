"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  CloseIcon,
  DashboardIcon,
  LogoutIcon,
  MenuIcon,
  PackageIcon,
  ReceiptIcon,
  StoreIcon,
} from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { PlanBadge } from "@/components/ui/pill";
import type { TenantSession } from "@/lib/types";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: DashboardIcon },
  { href: "/products", label: "Produk", icon: PackageIcon },
  { href: "/transactions", label: "Transaksi", icon: ReceiptIcon },
];

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-stone-900 transition-colors dark:bg-stone-100">
        <StoreIcon className="h-4 w-4 text-stone-50 dark:text-stone-900" />
      </span>
      <span>
        <span className="block text-[15px] font-medium leading-5 text-stone-900 transition-colors dark:text-stone-50">
          FlexShop
        </span>
        <span className="block text-[11.5px] text-stone-500 transition-colors dark:text-stone-400">
          Panel toko
        </span>
      </span>
    </Link>
  );
}

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="space-y-1">
      {NAV.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-[10px] px-3 py-2 text-[13.5px] font-medium transition-colors ${
              active
                ? "bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900"
                : "text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800/70"
            }`}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarFooter({
  tenant,
  loggingOut,
  onLogout,
}: {
  tenant: TenantSession;
  loggingOut: boolean;
  onLogout: () => void;
}) {
  return (
    <div className="mt-auto space-y-3">
      <div className="rounded-xl border border-stone-200/80 bg-white/60 p-3 transition-colors dark:border-stone-800/80 dark:bg-stone-950/60">
        <p className="truncate text-[12.5px] font-medium text-stone-800 dark:text-stone-200">
          {tenant.storeName}
        </p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <PlanBadge plan={tenant.plan} />
          <span className="font-mono text-[11px] text-stone-400 dark:text-stone-500">
            {tenant.plan === "PRO" ? "∞ produk" : `${tenant.maxProducts} produk`}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <button
          type="button"
          onClick={onLogout}
          disabled={loggingOut}
          className="flex h-9 flex-1 items-center justify-center gap-2 rounded-full border border-stone-200 bg-white/60 px-3 text-[12.5px] font-medium text-stone-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500 disabled:opacity-50 dark:border-stone-800 dark:bg-stone-900/60 dark:text-stone-300 dark:hover:border-red-800/50 dark:hover:bg-red-950/30 dark:hover:text-red-400"
        >
          <LogoutIcon className="h-4 w-4" />
          {loggingOut ? "Keluar..." : "Keluar"}
        </button>
      </div>
    </div>
  );
}

export function AppShell({
  tenant,
  children,
}: {
  tenant: TenantSession;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-stone-200/70 bg-white/40 px-4 py-6 backdrop-blur transition-colors dark:border-stone-800/70 dark:bg-stone-950/40 lg:flex">
        <div className="px-2">
          <Brand />
        </div>
        <p className="mt-8 px-2 text-[10.5px] font-medium uppercase tracking-[1.98px] text-stone-400 dark:text-stone-500">
          Menu
        </p>
        <div className="mt-2">
          <NavLinks pathname={pathname} />
        </div>
        <SidebarFooter
          tenant={tenant}
          loggingOut={loggingOut}
          onLogout={logout}
        />
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-stone-200/70 bg-[#f6f4ef]/85 px-4 py-3 backdrop-blur transition-colors dark:border-stone-800/70 dark:bg-[#0c0a09]/85 lg:hidden">
          <Brand />
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Buka menu"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-white/60 text-stone-600 transition-colors dark:border-stone-800 dark:bg-stone-900/60 dark:text-stone-300"
          >
            <MenuIcon className="h-4 w-4" />
          </button>
        </header>

        <main className="mx-auto w-full max-w-[1180px] px-4 py-6 sm:px-8 sm:py-10">
          {children}
        </main>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-stone-950/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <aside className="card-enter absolute left-0 top-0 flex h-full w-72 flex-col border-r border-stone-200/70 bg-[#f6f4ef] px-4 py-6 dark:border-stone-800/70 dark:bg-[#0c0a09]">
            <div className="flex items-center justify-between px-2">
              <Brand />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Tutup menu"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-stone-200 text-stone-500 dark:border-stone-800 dark:text-stone-400"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-8 px-2 text-[10.5px] font-medium uppercase tracking-[1.98px] text-stone-400 dark:text-stone-500">
              Menu
            </p>
            <div className="mt-2">
              <NavLinks
                pathname={pathname}
                onNavigate={() => setOpen(false)}
              />
            </div>
            <SidebarFooter
              tenant={tenant}
              loggingOut={loggingOut}
              onLogout={logout}
            />
          </aside>
        </div>
      ) : null}
    </div>
  );
}
