const starPath =
  "M12 2.5l2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.9 6.12 20.6l1.12-6.55L2.5 9.42l6.58-.96L12 2.5z";

export function StarRatingDisplay({
  rating,
  count,
  size = "sm",
}: {
  rating: number;
  count?: number;
  size?: "sm" | "md";
}) {
  const stars = Array.from({ length: 5 }, (_, index) => index + 1);
  const rounded = Math.round(rating * 10) / 10;
  const iconSize = size === "md" ? "h-5 w-5" : "h-4 w-4";

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {stars.map((value) => (
          <svg
            key={value}
            viewBox="0 0 24 24"
            className={`${iconSize} ${
              value <= Math.round(rating) ? "fill-amber-400" : "fill-slate-200"
            }`}
            aria-hidden="true"
          >
            <path d={starPath} />
          </svg>
        ))}
      </div>
      <span className="text-xs font-semibold text-slate-600">
        {rounded.toFixed(1)}
      </span>
      {typeof count === "number" ? (
        <span className="text-xs text-slate-500">
          ({count} review{count === 1 ? "" : "s"})
        </span>
      ) : null}
    </div>
  );
}
