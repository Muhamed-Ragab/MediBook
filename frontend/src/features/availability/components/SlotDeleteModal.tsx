import { useEffect, useRef } from "react";
import type { AvailabilitySlot } from "../types";

interface SlotDeleteModalProps {
  slot: AvailabilitySlot | null;
  isPending: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

function formatSlot(slot: AvailabilitySlot): string {
  const start = new Date(slot.start_time);
  return start.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SlotDeleteModal({
  slot,
  isPending,
  onConfirm,
  onClose,
}: SlotDeleteModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (slot && !dialog.open) {
      dialog.showModal();
    } else if (!slot && dialog.open) {
      dialog.close();
    }
  }, [slot]);

  return (
    <dialog ref={dialogRef} className="modal">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-2">Delete Slot</h3>
        <p className="text-base-content/70">
          Are you sure you want to delete the slot at{" "}
          <span className="font-semibold">
            {slot ? formatSlot(slot) : ""}
          </span>
          ? This action cannot be undone.
        </p>
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
            className="btn btn-error"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? (
              <span className="loading loading-spinner loading-xs" />
            ) : null}
            Delete
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit" onClick={onClose} aria-label="Close">
          close
        </button>
      </form>
    </dialog>
  );
}
