import type { ReactNode } from "react";
import { Card } from "./card";

export function StatCard({
  label,
  value,
  hint,
  children,
}: {
  label: string;
  value: string;
  hint?: string;
  children?: ReactNode;
}) {
  return (
    <Card className="p-5">
      <p className="text-[11px] font-medium uppercase tracking-[1.54px] text-stone-500 transition-colors dark:text-stone-400">
        {label}
      </p>
      <p className="stat-value mt-2 font-mono text-[22px] font-medium leading-tight text-stone-900 transition-colors dark:text-stone-50">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-[12px] text-stone-500 transition-colors dark:text-stone-400">
          {hint}
        </p>
      ) : null}
      {children ? <div className="mt-3">{children}</div> : null}
    </Card>
  );
}
