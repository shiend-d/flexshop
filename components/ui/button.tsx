import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "outline" | "danger" | "success";

const variants: Record<Variant, string> = {
  primary:
    "bg-stone-900 text-stone-50 hover:bg-stone-800 dark:bg-stone-50 dark:text-stone-900 dark:hover:bg-stone-200",
  ghost:
    "text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800",
  outline:
    "border border-stone-200 bg-white/60 text-stone-700 hover:bg-stone-100 dark:border-stone-800 dark:bg-stone-900/60 dark:text-stone-300 dark:hover:bg-stone-800",
  danger:
    "border border-[#ec003f]/20 bg-[#ec003f]/10 text-[#ec003f] hover:bg-[#ec003f]/20",
  success:
    "border border-[#00bc7d]/20 bg-[#00bc7d]/10 text-[#00bc7d] hover:bg-[#00bc7d]/20",
};

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-[14px] px-4 py-2.5 text-[13.5px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
