export function EmptyState({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="py-14 text-center">
      <p className="text-[15px] font-medium text-stone-500 dark:text-stone-400">
        {title}
      </p>
      {description ? (
        <p className="mt-1 text-[13px] text-stone-400 dark:text-stone-500">
          {description}
        </p>
      ) : null}
    </div>
  );
}
