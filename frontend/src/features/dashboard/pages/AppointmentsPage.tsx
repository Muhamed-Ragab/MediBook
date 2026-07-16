import { useState } from "react";
import { useAuthStore } from "@/shared/stores/authStore";
import { useAppointments, useCancelAppointment } from "@/features/booking/api/useDoctors";
import type { Appointment } from "@/features/booking/types";

type Tab = "upcoming" | "past";

const STATUS_STYLES: Record<string, string> = {
  Pending: "badge badge-warning",
  Confirmed: "badge badge-success",
  Completed: "badge badge-info",
  Cancelled: "badge badge-error",
};

function isUpcoming(a: Appointment): boolean {
  const start = new Date(a.slot_details.start_time);
  return start > new Date() && a.status !== "Cancelled";
}

export default function AppointmentsPage() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role;
  const [tab, setTab] = useState<Tab>("upcoming");

  const { data: appointments = [], isLoading } = useAppointments();
  const cancelAppointment = useCancelAppointment();

  const upcoming = appointments.filter(isUpcoming);
  const past = appointments.filter((a) => !isUpcoming(a));

  const displayed = tab === "upcoming" ? upcoming : past;

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function handleCancel(id: number) {
    if (window.confirm("Cancel this appointment?")) {
      cancelAppointment.mutate(id);
    }
  }

  const canCancel = (a: Appointment) =>
    a.status === "Pending" || a.status === "Confirmed";

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Appointments</h1>

      {/* Tabs */}
      <div className="tabs tabs-box mb-6">
        <button
          type="button"
          className={`tab ${tab === "upcoming" ? "tab-active" : ""}`}
          onClick={() => setTab("upcoming")}
        >
          Upcoming ({upcoming.length})
        </button>
        <button
          type="button"
          className={`tab ${tab === "past" ? "tab-active" : ""}`}
          onClick={() => setTab("past")}
        >
          Past ({past.length})
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-12 text-base-content/50">
          <p className="text-lg">No {tab} appointments</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayed.map((appt) => (
            <div
              key={appt.id}
              className="card card-bordered bg-base-100 shadow-sm"
            >
              <div className="card-body p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">
                        {role === "doctor"
                          ? appt.patient_name
                          : appt.slot_details.doctor_name}
                      </h3>
                      <span className={STATUS_STYLES[appt.status]}>
                        {appt.status}
                      </span>
                    </div>
                    <p className="text-sm text-base-content/70">
                      {formatDate(appt.slot_details.start_time)}
                    </p>
                    <p className="text-sm text-base-content/70">
                      {formatTime(appt.slot_details.start_time)} —{" "}
                      {formatTime(appt.slot_details.end_time)}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {tab === "upcoming" && canCancel(appt) && (
                      <button
                        type="button"
                        className="btn btn-outline btn-error btn-xs"
                        onClick={() => handleCancel(appt.id)}
                        disabled={cancelAppointment.isPending}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {cancelAppointment.isSuccess && (
        <div className="toast toast-end toast-top">
          <div className="alert alert-success">Appointment cancelled</div>
        </div>
      )}
      {cancelAppointment.isError && (
        <div className="toast toast-end toast-top">
          <div className="alert alert-error">
            {cancelAppointment.error?.message || "Failed to cancel"}
          </div>
        </div>
      )}
    </div>
  );
}
