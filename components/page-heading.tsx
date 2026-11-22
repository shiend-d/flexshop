import type { ReactNode } from "react";

export function PageHeading({
  label,
  title,
  description,
  action,
}: {
  label: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[11px] uppercase tracking-[1.98px] text-stone-500 transition-colors dark:text-stone-400">
          {label}
        </p>
        <h1 className="mt-2 text-[24px] font-medium leading-tight text-stone-900 transition-colors dark:text-stone-50 sm:text-[28px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 text-[13px] text-stone-500 transition-colors dark:text-stone-400">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
