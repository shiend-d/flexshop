import type { ReactNode } from "react";

export function Card({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border border-stone-200/80 bg-white/70 transition-colors dark:border-stone-800/80 dark:bg-stone-900/70 ${className}`}
    >
      {children}
    </div>
  );
}
