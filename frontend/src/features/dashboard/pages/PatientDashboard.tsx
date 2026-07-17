import { Link } from "react-router";
import { useAuthStore } from "@/shared/stores/authStore";
import { useAppointments, useCancelAppointment } from "@/features/booking/api/useDoctors";
import type { Appointment } from "@/features/booking/types";

const STATUS_STYLES: Record<string, string> = {
  Pending: "badge badge-warning",
  Confirmed: "badge badge-success",
  Completed: "badge badge-info",
  Cancelled: "badge badge-error",
};

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

export default function PatientDashboard() {
  const user = useAuthStore((s) => s.user);
  const { data: appointments = [], isLoading, isError, error } = useAppointments();
  const cancelAppointment = useCancelAppointment();

  const upcoming = appointments
    .filter(
      (a) =>
        new Date(a.slot_details.start_time) > new Date() &&
        a.status !== "Cancelled",
    )
    .sort(
      (a, b) =>
        new Date(a.slot_details.start_time).getTime() -
        new Date(b.slot_details.start_time).getTime(),
    )
    .slice(0, 5);

  const upcomingCount = upcoming.length;

  function handleCancel(id: number) {
    if (window.confirm("Cancel this appointment?")) {
      cancelAppointment.mutate(id);
    }
  }

  const canCancel = (a: Appointment) =>
    a.status === "Pending" || a.status === "Confirmed";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6">
        <div className="alert alert-error">
          <span>
            {error instanceof Error
              ? error.message
              : "Failed to load dashboard"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="card bg-primary text-primary-content">
        <div className="card-body">
          <h1 className="card-title text-2xl">
            Welcome, {user?.first_name || "Patient"}
          </h1>
          <p>Manage your appointments and healthcare</p>
        </div>
      </div>

      <div className="stats shadow">
        <div className="stat">
          <div className="stat-title">Upcoming Appointments</div>
          <div className="stat-value text-primary">{upcomingCount}</div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Recent Appointments</h2>
        {upcoming.length === 0 ? (
          <div className="text-center py-8 text-base-content/50">
            <p>No upcoming appointments</p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcoming.map((appt) => (
              <div
                key={appt.id}
                className="card card-bordered bg-base-100 shadow-sm"
              >
                <div className="card-body p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">
                          {appt.slot_details.doctor_name}
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
                    {canCancel(appt) && (
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
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Quick Links</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/patient/search" className="btn btn-primary">
            Find a Doctor
          </Link>
          <Link to="/patient/appointments" className="btn btn-outline">
            View All Appointments
          </Link>
          <Link to="/patient/profile" className="btn btn-outline">
            Edit Profile
          </Link>
        </div>
      </div>

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

