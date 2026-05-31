import { useState } from "react";

const starPath =
  "M12 2.5l2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.9 6.12 20.6l1.12-6.55L2.5 9.42l6.58-.96L12 2.5z";

export function StarRatingInput({
  value,
  onChange,
  disabled = false,
}: {
  value: number;
  onChange: (next: number) => void;
  disabled?: boolean;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const displayValue = hovered ?? value;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }, (_, index) => {
          const ratingValue = index + 1;
          const filled = ratingValue <= displayValue;

          return (
            <button
              key={ratingValue}
              type="button"
              className="rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
              onMouseEnter={() => !disabled && setHovered(ratingValue)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => !disabled && setHovered(ratingValue)}
              onBlur={() => setHovered(null)}
              onClick={() => !disabled && onChange(ratingValue)}
              disabled={disabled}
              aria-label={`${ratingValue} star${ratingValue === 1 ? "" : "s"}`}
            >
              <svg
                viewBox="0 0 24 24"
                className={`h-6 w-6 transition ${
                  filled ? "fill-amber-400" : "fill-slate-200"
                } ${disabled ? "opacity-60" : "hover:fill-amber-300"}`}
                aria-hidden="true"
              >
                <path d={starPath} />
              </svg>
            </button>
          );
        })}
      </div>
      <span className="text-sm font-semibold text-slate-600">
        {value.toFixed(1)}
      </span>
    </div>
  );
}
