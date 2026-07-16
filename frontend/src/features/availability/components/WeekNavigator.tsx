import { DAYS_OF_WEEK } from "../constants";

interface WeekNavigatorProps {
  weekStart: Date;
  onPrev: () => void;
  onNext: () => void;
}

export default function WeekNavigator({
  weekStart,
  onPrev,
  onNext,
}: WeekNavigatorProps) {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div className="flex items-center justify-between mb-4">
      <button
        type="button"
        onClick={onPrev}
        className="btn btn-ghost btn-sm"
      >
        ← Previous
      </button>
      <div className="flex gap-1 items-center">
        <span className="font-semibold">
          {fmt(weekStart)} — {fmt(weekEnd)}
        </span>
        <span className="text-xs text-base-content/50 ml-2">
          {DAYS_OF_WEEK[weekStart.getDay() === 0 ? 6 : weekStart.getDay() - 1]}
          {" – "}
          {DAYS_OF_WEEK[weekEnd.getDay() === 0 ? 6 : weekEnd.getDay() - 1]}
        </span>
      </div>
      <button
        type="button"
        onClick={onNext}
        className="btn btn-ghost btn-sm"
      >
        Next →
      </button>
    </div>
  );
}
