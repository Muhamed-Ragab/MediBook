import { useMemo } from "react";
import { Link } from "react-router";
import { useAuthStore } from "@/shared/stores/authStore";
import {
  useAppointments,
  useUpdateAppointmentStatus,
} from "@/features/booking/api/useDoctors";

const STATUS_STYLES: Record<string, string> = {
  Pending: "badge badge-warning",
  Confirmed: "badge badge-success",
  Completed: "badge badge-info",
  Cancelled: "badge badge-error",
};

function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DoctorDashboard() {
  const user = useAuthStore((s) => s.user);
  const { data: appointments = [], isLoading } = useAppointments();
  const updateStatus = useUpdateAppointmentStatus();

  const upcoming = useMemo(
    () =>
      appointments
        .filter(
          (a) =>
            new Date(a.slot_details.start_time) > new Date() &&
            a.status !== "Cancelled",
        )
        .sort(
          (a, b) =>
            new Date(a.slot_details.start_time).getTime() -
            new Date(b.slot_details.start_time).getTime(),
        ),
    [appointments],
  );

  const todayCount = useMemo(
    () =>
      upcoming.filter((a) => isToday(new Date(a.slot_details.start_time)))
        .length,
    [upcoming],
  );

  const recentAppointments = upcoming.slice(0, 5);

  function handleUpdateStatus(id: number, status: string) {
    updateStatus.mutate({ id, status });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h1 className="text-2xl font-bold text-base-content">
            Welcome, Dr. {user?.first_name || "Doctor"}
          </h1>
          <p className="text-base-content/60">
            Here is your practice overview for today.
          </p>
        </div>
      </div>

      <div className="stats stats-vertical sm:stats-horizontal shadow-sm w-full">
        <div className="stat">
          <div className="stat-title">Upcoming Appointments</div>
          <div className="stat-value text-primary">{upcoming.length}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Today's Appointments</div>
          <div className="stat-value text-accent">{todayCount}</div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <h2 className="card-title text-lg">
            Recent Upcoming Appointments
          </h2>

          {recentAppointments.length === 0 ? (
            <div className="text-center py-8 text-base-content/50">
              <p className="text-lg">No upcoming appointments</p>
              <p className="text-sm mt-1">
                When patients book appointments, they will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentAppointments.map((appt) => (
                <div
                  key={appt.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-base-300"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {appt.patient_name}
                      </span>
                      <span className={STATUS_STYLES[appt.status]}>
                        {appt.status}
                      </span>
                    </div>
                    <p className="text-sm text-base-content/70">
                      {formatDate(appt.slot_details.start_time)} —{" "}
                      {formatTime(appt.slot_details.start_time)}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {appt.status === "Pending" && (
                      <button
                        type="button"
                        className="btn btn-success btn-xs"
                        onClick={() =>
                          handleUpdateStatus(appt.id, "Confirmed")
                        }
                        disabled={updateStatus.isPending}
                      >
                        Confirm
                      </button>
                    )}
                    {appt.status === "Confirmed" && (
                      <button
                        type="button"
                        className="btn btn-info btn-xs"
                        onClick={() =>
                          handleUpdateStatus(appt.id, "Completed")
                        }
                        disabled={updateStatus.isPending}
                      >
                        Complete
                      </button>
                    )}
                    {(appt.status === "Pending" ||
                      appt.status === "Confirmed") && (
                      <button
                        type="button"
                        className="btn btn-outline btn-error btn-xs"
                        onClick={() =>
                          handleUpdateStatus(appt.id, "Cancelled")
                        }
                        disabled={updateStatus.isPending}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link to="/doctor/availability" className="btn btn-outline">
          Manage Availability
        </Link>
        <Link to="/doctor/appointments" className="btn btn-outline">
          View All Appointments
        </Link>
        <Link to="/doctor/profile" className="btn btn-outline">
          Edit Profile
        </Link>
      </div>

      {updateStatus.isSuccess && (
        <div className="toast toast-end toast-top">
          <div className="alert alert-success">
            Status updated successfully
          </div>
        </div>
      )}
      {updateStatus.isError && (
        <div className="toast toast-end toast-top">
          <div className="alert alert-error">
            {updateStatus.error?.message || "Failed to update status"}
          </div>
        </div>
      )}
    </div>
  );
}
