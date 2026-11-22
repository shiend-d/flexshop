import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react";

const labelClass =
  "mb-1 block text-[11px] font-medium uppercase tracking-[1.54px] text-stone-500 transition-colors dark:text-stone-400";

const controlClass =
  "w-full border-0 border-b border-stone-200 bg-transparent pb-1.5 pt-1.5 font-mono text-[13.5px] text-stone-800 transition-colors placeholder:text-stone-400 focus:border-stone-900 focus:outline-none dark:border-stone-800 dark:text-stone-200 dark:placeholder:text-stone-500 dark:focus:border-stone-100";

export function Field({
  label,
  id,
  error,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  id: string;
  error?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <input id={id} className={controlClass} {...props} />
      {error ? (
        <p className="mt-1 text-[11.5px] text-[#ec003f]">{error}</p>
      ) : null}
    </div>
  );
}

export function SelectField({
  label,
  id,
  error,
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  id: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <select
        id={id}
        className={`${controlClass} [&>option]:bg-[#f6f4ef] [&>option]:text-stone-900 dark:[&>option]:bg-[#0c0a09] dark:[&>option]:text-stone-100`}
        {...props}
      >
        {children}
      </select>
      {error ? (
        <p className="mt-1 text-[11.5px] text-[#ec003f]">{error}</p>
      ) : null}
    </div>
  );
}
