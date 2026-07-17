import { useCallback, useMemo, useState } from "react";
import WeeklyCalendar from "../components/WeeklyCalendar";
import WeekNavigator from "../components/WeekNavigator";
import WeekTemplateGenerator from "../components/WeekTemplateGenerator";
import SlotDeleteModal from "../components/SlotDeleteModal";
import {
  useSlots,
  useCreateSlot,
  useBulkCreateSlots,
  useDeleteSlot,
} from "../api/useSlots";
import { useDoctorProfile } from "@/features/profile/api/profileApi";
import type { AvailabilitySlot } from "../types";

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addWeeks(date: Date, weeks: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + weeks * 7);
  return d;
}

export default function AvailabilityPage() {
  const { data: profile, isLoading: profileLoading } = useDoctorProfile();
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));

  const doctorId = profile?.id ?? 0;
  const weekEnd = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6);
    return d;
  }, [weekStart]);

  const { data: slots = [], isLoading: slotsLoading } = useSlots(doctorId, weekStart, weekEnd);
  const createSlot = useCreateSlot(doctorId);
  const bulkCreate = useBulkCreateSlots(doctorId);
  const deleteSlot = useDeleteSlot(doctorId);

  const [pendingDeleteSlot, setPendingDeleteSlot] =
    useState<AvailabilitySlot | null>(null);

  const handlePrev = useCallback(
    () => setWeekStart((prev) => addWeeks(prev, -1)),
    [],
  );
  const handleNext = useCallback(
    () => setWeekStart((prev) => addWeeks(prev, 1)),
    [],
  );

  const handleCreateSlot = useCallback(
    (startTime: string, endTime: string) => {
      createSlot.mutate({ start_time: startTime, end_time: endTime });
    },
    [createSlot],
  );

  const handleRequestDeleteSlot = useCallback((slot: AvailabilitySlot) => {
    setPendingDeleteSlot(slot);
  }, []);

  const handleConfirmDeleteSlot = useCallback(() => {
    if (!pendingDeleteSlot) return;
    deleteSlot.mutate(pendingDeleteSlot.id, {
      onSuccess: () => setPendingDeleteSlot(null),
    });
  }, [deleteSlot, pendingDeleteSlot]);

  const handleGenerateWeek = useCallback(
    (slots: { start_time: string; end_time: string }[]) => {
      bulkCreate.mutate(slots);
    },
    [bulkCreate],
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Availability</h1>

      <WeekNavigator
        weekStart={weekStart}
        onPrev={handlePrev}
        onNext={handleNext}
      />

      {profileLoading || slotsLoading ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg" />
        </div>
      ) : (
        <WeeklyCalendar
          weekStart={weekStart}
          slots={slots}
          doctorId={doctorId}
          onCreateSlot={handleCreateSlot}
          onRequestDeleteSlot={handleRequestDeleteSlot}
          isPending={createSlot.isPending || deleteSlot.isPending}
        />
      )}

      <div className="mt-4">
        <WeekTemplateGenerator
          weekStart={weekStart}
          onGenerate={handleGenerateWeek}
          isPending={bulkCreate.isPending}
        />
      </div>

      {/* Feedback toasts */}
      {createSlot.isSuccess && (
        <div className="toast toast-end toast-top">
          <div className="alert alert-success">Slot created</div>
        </div>
      )}
      {createSlot.isError && (
        <div className="toast toast-end toast-top">
          <div className="alert alert-error">
            {createSlot.error?.message || "Failed to create slot"}
          </div>
        </div>
      )}
      {deleteSlot.isSuccess && (
        <div className="toast toast-end toast-top">
          <div className="alert alert-success">Slot deleted</div>
        </div>
      )}
      {bulkCreate.isSuccess && (
        <div className="toast toast-end toast-top">
          <div className="alert alert-success">
            Created {bulkCreate.data.created.length} slot
            {bulkCreate.data.created.length !== 1 ? "s" : ""}
            {bulkCreate.data.rejected.length > 0 && (
              <>
                , {bulkCreate.data.rejected.length} skipped
              </>
            )}
          </div>
        </div>
      )}

      <SlotDeleteModal
        slot={pendingDeleteSlot}
        isPending={deleteSlot.isPending}
        onConfirm={handleConfirmDeleteSlot}
        onClose={() => setPendingDeleteSlot(null)}
      />
    </div>
  );
}
