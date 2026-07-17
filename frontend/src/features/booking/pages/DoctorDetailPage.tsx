import { useCallback, useMemo, useState, Fragment } from "react";
import { useParams, useNavigate } from "react-router";
import { useDoctors, useAvailableSlots, useBookAppointment } from "../api/useDoctors";
import BookingConfirmModal from "../components/BookingConfirmModal";
import type { AvailableSlot } from "../types";

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function fmtDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Default visible range; expanded dynamically to fit actual slots (see below).
const DEFAULT_START_HOUR = 9;
const DEFAULT_END_HOUR = 17;

export default function DoctorDetailPage() {
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();
  const numDoctorId = Number(doctorId);

  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);

  const weekEnd = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6);
    return d;
  }, [weekStart]);

  const from = fmtDate(weekStart);
  const to = fmtDate(weekEnd);

  const { data: doctors = [] } = useDoctors();
  const doctor = doctors.find((d) => d.id === numDoctorId);

  const { data: availableSlots = [] } = useAvailableSlots(
    numDoctorId,
    from,
    to,
  );
  const bookAppointment = useBookAppointment();

  // Render time blocks that cover every slot the doctor actually has,
  // falling back to a 09:00–17:00 default when none exist. This guarantees
  // slots created at any hour (e.g. early morning or evening) are visible.
  const TIME_BLOCKS = useMemo(() => {
    let startHour = DEFAULT_START_HOUR;
    let endHour = DEFAULT_END_HOUR;
    for (const slot of availableSlots) {
      const h = new Date(slot.start_time).getHours();
      if (h < startHour) startHour = h;
      if (h + 1 > endHour) endHour = h + 1;
    }
    const blocks: string[] = [];
    for (let h = startHour; h < endHour; h++) {
      blocks.push(`${h}:00`);
      blocks.push(`${h}:30`);
    }
    return blocks;
  }, [availableSlots]);

  const slotMap = useMemo(() => {
    const map = new Map<string, AvailableSlot>();
    for (const slot of availableSlots) {
      const d = new Date(slot.start_time);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}:${d.getMinutes()}`;
      map.set(key, slot);
    }
    return map;
  }, [availableSlots]);

  function getDateForBlock(dayOffset: number, timeStr: string): Date {
    const [h, m] = timeStr.split(":").map(Number);
    const date = new Date(weekStart);
    date.setDate(date.getDate() + dayOffset);
    date.setHours(h, m, 0, 0);
    return date;
  }

  function slotKey(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}:${date.getMinutes()}`;
  }

  function handleSlotClick(dayOffset: number, timeStr: string) {
    const start = getDateForBlock(dayOffset, timeStr);
    const key = slotKey(start);
    const slot = slotMap.get(key);
    if (!slot || slot.is_booked) return;
    if (start <= new Date()) return;
    setSelectedSlot(slot);
  }

  const handleConfirmBooking = useCallback(() => {
    if (!selectedSlot) return;
    bookAppointment.mutate(
      { slot: selectedSlot.id },
      {
        onSuccess: (data) => {
          if (data.success) {
            setSelectedSlot(null);
            navigate("/patient/appointments");
          }
        },
      },
    );
  }, [selectedSlot, bookAppointment, navigate]);

  if (!doctor) {
    return (
      <div className="p-6">
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <button
        type="button"
        className="btn btn-ghost btn-sm mb-4"
        onClick={() => navigate("/patient/search")}
      >
        ← Back to search
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          Dr. {doctor.name}
        </h1>
        <p className="badge badge-primary badge-outline mt-1">
          {doctor.specialty || "General"}
        </p>
        {doctor.bio && (
          <p className="text-sm text-base-content/70 mt-2">{doctor.bio}</p>
        )}
      </div>

      <h2 className="text-lg font-semibold mb-3">Available Slots</h2>

      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          className="btn btn-ghost btn-xs"
          onClick={() => {
            const d = new Date(weekStart);
            d.setDate(d.getDate() - 7);
            setWeekStart(d);
          }}
        >
          ← Previous
        </button>
        <span className="text-sm font-medium">
          {weekStart.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
          {" — "}
          {weekEnd.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>
        <button
          type="button"
          className="btn btn-ghost btn-xs"
          onClick={() => {
            const d = new Date(weekStart);
            d.setDate(d.getDate() + 7);
            setWeekStart(d);
          }}
        >
          Next →
        </button>
      </div>

      <div
        className="grid gap-px bg-base-200 rounded-box overflow-x-auto"
        style={{ gridTemplateColumns: `70px repeat(7, 1fr)` }}
      >
        <div className="bg-base-100 p-1 text-xs" />
        {DAYS_OF_WEEK.map((day, i) => {
          const d = new Date(weekStart);
          d.setDate(d.getDate() + i);
          return (
            <div key={day} className="bg-base-100 p-1 text-center text-xs">
              <div className="font-semibold">{day}</div>
              <div className="text-base-content/50">{d.getDate()}</div>
            </div>
          );
        })}

        {TIME_BLOCKS.map((timeStr) => (
          <Fragment
            key={timeStr}
          >
            <div
              key={`l-${timeStr}`}
              className="bg-base-100 p-1 text-xs text-base-content/50 text-right pr-1"
            >
              {timeStr}
            </div>
            {Array.from({ length: 7 }, (_, dayOffset) => {
              const start = getDateForBlock(dayOffset, timeStr);
              const key = slotKey(start);
              const slot = slotMap.get(key);
              const isPast = start <= new Date();

              let cls = "bg-base-100 h-5";
              if (slot && !slot.is_booked && !isPast) {
                cls =
                  "bg-success/50 hover:bg-success/70 cursor-pointer h-5";
              } else if (isPast) {
                cls = "bg-base-200 opacity-40 h-5";
              } else {
                cls = "bg-base-100 h-5";
              }

              return (
                <div
                  key={`c-${dayOffset}-${timeStr}`}
                  className={cls}
                  onClick={() => handleSlotClick(dayOffset, timeStr)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleSlotClick(dayOffset, timeStr);
                    }
                  }}
                  role="gridcell"
                  aria-label={
                    slot && !slot.is_booked && !isPast
                      ? "Click to book"
                      : `Slot ${timeStr}`
                  }
                  tabIndex={slot && !slot.is_booked && !isPast ? 0 : -1}
                  title={
                    slot && !slot.is_booked && !isPast
                      ? "Click to book"
                      : ""
                  }
                />
              );
            })}
          </Fragment>
        ))}
      </div>

      <BookingConfirmModal
        slot={selectedSlot!}
        doctorName={`Dr. ${doctor.name}`}
        isOpen={!!selectedSlot}
        isPending={bookAppointment.isPending}
        onConfirm={handleConfirmBooking}
        onClose={() => setSelectedSlot(null)}
      />

      {bookAppointment.isError && (
        <div className="toast toast-end toast-top">
          <div className="alert alert-error">
            {bookAppointment.error?.message || "Booking failed"}
          </div>
        </div>
      )}
    </div>
  );
}
