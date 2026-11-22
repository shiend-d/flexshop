import type { ReactNode } from "react";
import type { Plan } from "@/lib/types";

type Tone = "neutral" | "accent" | "warn" | "danger";

const tones: Record<Tone, string> = {
  neutral:
    "border-stone-200 bg-white/60 text-stone-600 dark:border-stone-800 dark:bg-stone-950/60 dark:text-stone-300",
  accent:
    "border-[#00bc7d]/20 bg-[#00bc7d]/10 text-[#00bc7d] dark:border-[#00bc7d]/20 dark:bg-[#00bc7d]/10 dark:text-[#00bc7d]",
  warn: "border-[#fe9a00]/25 bg-[#fe9a00]/10 text-[#c27400] dark:text-[#fe9a00]",
  danger:
    "border-[#ec003f]/20 bg-[#ec003f]/10 text-[#ec003f] dark:text-[#ff4d73]",
};

export function Pill({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-medium transition-colors ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function PlanBadge({ plan }: { plan: Plan }) {
  return (
    <Pill tone={plan === "PRO" ? "accent" : "neutral"}>
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          plan === "PRO" ? "bg-[#00bc7d]" : "bg-stone-400"
        }`}
      />
      {plan}
    </Pill>
  );
}
