type Tone = "accent" | "warn" | "danger";

const tones: Record<Tone, string> = {
  accent: "bg-[#00bc7d]",
  warn: "bg-[#fe9a00]",
  danger: "bg-[#ec003f]",
};

export function Progress({
  value,
  tone = "accent",
}: {
  value: number;
  tone?: Tone;
}) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className="h-[3px] w-full overflow-hidden rounded-full bg-stone-200 transition-colors dark:bg-stone-800">
      <div
        className={`h-full rounded-full transition-all duration-500 ${tones[tone]}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
