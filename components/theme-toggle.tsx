"use client";

import { MoonIcon, SunIcon } from "@/components/icons";

export function ThemeToggle({ className = "" }: { className?: string }) {
  function toggleTheme() {
    const isDark = document.documentElement.classList.toggle("dark");
    try {
      localStorage.setItem("flexshop-theme", isDark ? "dark" : "light");
    } catch {
      // localStorage bisa tidak tersedia; abaikan.
    }
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title="Ganti tema"
      aria-label="Ganti tema"
      className={`flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-white/60 text-stone-600 transition-colors hover:bg-stone-100 dark:border-stone-800 dark:bg-stone-900/60 dark:text-stone-300 dark:hover:bg-stone-800 ${className}`}
    >
      <SunIcon className="hidden h-4 w-4 dark:block" />
      <MoonIcon className="block h-4 w-4 dark:hidden" />
    </button>
  );
}
