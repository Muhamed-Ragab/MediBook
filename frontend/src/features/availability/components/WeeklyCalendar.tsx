import { DAYS_OF_WEEK, TIME_BLOCKS } from "../constants";
import type { AvailabilitySlot } from "../types";

interface WeeklyCalendarProps {
  weekStart: Date;
  slots: AvailabilitySlot[];
  doctorId: number;
  readOnly?: boolean;
  onCreateSlot: (startTime: string, endTime: string) => void;
  onRequestDeleteSlot: (slot: AvailabilitySlot) => void;
  isPending?: boolean;
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatSlotKey(startTime: string): string {
  const d = new Date(startTime);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}:${d.getMinutes()}`;
}

function slotToKey(slot: AvailabilitySlot): string {
  return formatSlotKey(slot.start_time);
}

export default function WeeklyCalendar({
  weekStart,
  slots,
  readOnly = false,
  onCreateSlot,
  onRequestDeleteSlot,
  isPending,
}: WeeklyCalendarProps) {
  const monday = getMonday(weekStart);
  const slotMap = new Map<string, AvailabilitySlot>();
  for (const slot of slots) {
    slotMap.set(slotToKey(slot), slot);
  }

  function getDateForBlock(dayOffset: number, timeStr: string): Date {
    const [h, m] = timeStr.split(":").map(Number);
    const date = new Date(monday);
    date.setDate(date.getDate() + dayOffset);
    date.setHours(h, m, 0, 0);
    return date;
  }

  function isPast(date: Date): boolean {
    return date <= new Date();
  }

  function handleBlockClick(dayOffset: number, timeStr: string) {
    if (readOnly || isPending) return;
    const start = getDateForBlock(dayOffset, timeStr);
    if (isPast(start)) return;
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + 30);

    const key = formatSlotKey(start.toISOString());
    const existing = slotMap.get(key);
    if (existing) {
      if (!existing.is_booked) {
        onRequestDeleteSlot(existing);
      }
      return;
    }

    onCreateSlot(start.toISOString(), end.toISOString());
  }

  return (
    <div className="overflow-x-auto">
      <div
        className="grid gap-px bg-base-200 rounded-box"
        style={{
          gridTemplateColumns: `80px repeat(7, 1fr)`,
        }}
      >
        {/* Header row */}
        <div className="bg-base-100 p-2 font-semibold text-sm text-center" />
        {DAYS_OF_WEEK.map((day, i) => {
          const date = new Date(monday);
          date.setDate(date.getDate() + i);
          return (
            <div
              key={day}
              className="bg-base-100 p-2 text-center"
            >
              <div className="font-semibold text-sm">{day}</div>
              <div className="text-xs text-base-content/60">
                {date.getDate()}
              </div>
            </div>
          );
        })}

        {/* Time rows */}
        {TIME_BLOCKS.map((timeStr) => (
          <>
            <div
              key={`label-${timeStr}`}
              className="bg-base-100 p-1 text-xs text-base-content/60 flex items-center justify-end pr-2"
            >
              {timeStr}
            </div>
            {Array.from({ length: 7 }, (_, dayOffset) => {
              const start = getDateForBlock(dayOffset, timeStr);
              const key = formatSlotKey(start.toISOString());
              const slot = slotMap.get(key);
              const past = isPast(start);

              let cellClass = "bg-base-100";
              let title = "";
              if (slot) {
                if (slot.is_booked) {
                  cellClass = "bg-gray-400 cursor-not-allowed";
                  title = "Booked";
                } else {
                  cellClass = "bg-success/50 hover:bg-success/70 cursor-pointer";
                  title = "Available — click to delete";
                }
              } else if (!past && !readOnly) {
                cellClass = "bg-base-100 hover:bg-primary/10 cursor-pointer";
                title = "Click to create slot";
              } else if (past) {
                cellClass = "bg-base-200 opacity-40";
              }

              return (
                <div
                  key={`cell-${dayOffset}-${timeStr}`}
                  className={`h-6 border-b border-base-200 ${cellClass}`}
                  title={title}
                  onClick={() => handleBlockClick(dayOffset, timeStr)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleBlockClick(dayOffset, timeStr);
                    }
                  }}
                  role="gridcell"
                  aria-label={title || `Slot ${timeStr}`}
                  tabIndex={slot || (!past && !readOnly) ? 0 : -1}
                />
              );
            })}
          </>
        ))}
      </div>
    </div>
  );
}
