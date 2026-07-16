import { useState } from "react";
import { DAYS_OF_WEEK, START_HOUR, END_HOUR } from "../constants";

interface WeekTemplateGeneratorProps {
  weekStart: Date;
  onGenerate: (slots: { start_time: string; end_time: string }[]) => void;
  isPending?: boolean;
}

export default function WeekTemplateGenerator({
  weekStart,
  onGenerate,
  isPending,
}: WeekTemplateGeneratorProps) {
  const [selectedDays, setSelectedDays] = useState<Set<string>>(
    new Set(DAYS_OF_WEEK.slice(0, 5)),
  );
  const [startHour, setStartHour] = useState(START_HOUR);
  const [endHour, setEndHour] = useState(END_HOUR);

  function getMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function toggleDay(day: string) {
    const next = new Set(selectedDays);
    if (next.has(day)) next.delete(day);
    else next.add(day);
    setSelectedDays(next);
  }

  function handleGenerate() {
    const monday = getMonday(weekStart);
    const slots: { start_time: string; end_time: string }[] = [];

    DAYS_OF_WEEK.forEach((day, idx) => {
      if (!selectedDays.has(day)) return;
      for (let h = startHour; h < endHour; h++) {
        for (const m of [0, 30] as const) {
          const start = new Date(monday);
          start.setDate(start.getDate() + idx);
          start.setHours(h, m, 0, 0);

          const end = new Date(start);
          end.setMinutes(end.getMinutes() + 30);

          slots.push({
            start_time: start.toISOString(),
            end_time: end.toISOString(),
          });
        }
      }
    });

    onGenerate(slots);
  }

  return (
    <div className="collapse bg-base-200 rounded-box">
      <input type="checkbox" defaultChecked />
      <div className="collapse-title text-sm font-semibold">
        Generate Week Template
      </div>
      <div className="collapse-content">
        <div className="flex flex-wrap gap-2 mb-3">
          {DAYS_OF_WEEK.map((day) => (
            <label key={day} className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={selectedDays.has(day)}
                onChange={() => toggleDay(day)}
                className="checkbox checkbox-xs"
              />
              {day}
            </label>
          ))}
        </div>

        <div className="flex gap-4 mb-3 items-center">
          <label className="flex items-center gap-2 text-sm">
            From:
            <select
              value={startHour}
              onChange={(e) => setStartHour(Number(e.target.value))}
              className="select select-bordered select-xs"
            >
              {Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => (
                <option key={START_HOUR + i} value={START_HOUR + i}>
                  {START_HOUR + i}:00
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            To:
            <select
              value={endHour}
              onChange={(e) => setEndHour(Number(e.target.value))}
              className="select select-bordered select-xs"
            >
              {Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => (
                <option key={START_HOUR + i} value={START_HOUR + i}>
                  {START_HOUR + i}:00
                </option>
              ))}
            </select>
          </label>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={isPending || selectedDays.size === 0}
          className="btn btn-primary btn-sm"
        >
          {isPending ? (
            <span className="loading loading-spinner loading-xs" />
          ) : (
            "Generate"
          )}
        </button>
      </div>
    </div>
  );
}
