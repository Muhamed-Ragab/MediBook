import { useCallback } from "react";
import type { AvailableSlot } from "../types";

interface BookingConfirmModalProps {
  slot: AvailableSlot;
  doctorName: string;
  isOpen: boolean;
  isPending: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function BookingConfirmModal({
  slot,
  doctorName,
  isOpen,
  isPending,
  onConfirm,
  onClose,
}: BookingConfirmModalProps) {
  const handleBackdropKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  if (!isOpen) return null;

  const start = new Date(slot.start_time);
  const dateStr = start.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = start.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const end = new Date(slot.end_time);
  const endTimeStr = end.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <dialog
      className="modal modal-open"
      onClick={onClose}
      onKeyDown={handleBackdropKeyDown}
      role="dialog"
      aria-modal="true"
    >
        <div
          className="modal-box"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          role="document"
        >
        <h3 className="font-bold text-lg mb-4">Confirm Booking</h3>

        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-base-content/60">Doctor</span>
            <span className="font-medium">{doctorName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-base-content/60">Date</span>
            <span className="font-medium">{dateStr}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-base-content/60">Time</span>
            <span className="font-medium">
              {timeStr} — {endTimeStr}
            </span>
          </div>
        </div>

        <div className="modal-action">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            disabled={isPending}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              "Confirm Booking"
            )}
          </button>
        </div>
      </div>
      <div
        className="modal-backdrop"
        onClick={onClose}
        onKeyDown={handleBackdropKeyDown}
        role="presentation"
      />
    </dialog>
  );
}
