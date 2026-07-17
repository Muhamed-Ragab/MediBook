import { useMemo, useState } from "react";
import { useAppointments } from "@/features/booking/api/useDoctors";

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

export default function AdminAppointments() {
  const { data: appointments, isLoading, isError } = useAppointments();
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filtered = useMemo(() => {
    if (!appointments) return [];
    if (!search.trim()) return appointments;
    const q = search.toLowerCase();
    return appointments.filter(
      (a) =>
        a.patient_name.toLowerCase().includes(q) ||
        a.slot_details.doctor_name.toLowerCase().includes(q),
    );
  }, [appointments, search]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <p className="text-error font-medium">Failed to load appointments</p>
          <p className="text-base-content/60 text-sm mt-1">Please try again later</p>
        </div>
      </div>
    );
  }

  if (!appointments || appointments.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Appointments</h1>
        <div className="card bg-base-100 border border-base-200">
          <div className="card-body items-center py-16">
            <p className="text-base-content/40 font-medium">No appointments found</p>
            <p className="text-base-content/30 text-sm">
              Appointments will appear here once patients book
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Appointments</h1>
        <p className="text-base-content/60 mt-1">
          {filtered.length} appointment{filtered.length !== 1 ? "s" : ""}
          {filtered.length !== appointments.length
            ? ` (filtered from ${appointments.length})`
            : ""}
        </p>
      </div>

      <label className="input input-bordered flex items-center gap-2 max-w-sm">
        <svg
          viewBox="0 0 24 24"
          className="w-4 h-4 fill-current opacity-60 shrink-0"
          aria-hidden="true"
        >
          <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search by patient or doctor name..."
          className="grow"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>

      <div className="card bg-base-100 border border-base-200">
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>ID</th>
                <th>Patient Name</th>
                <th>Doctor Name</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((appt) => (
                <tr
                  key={appt.id}
                  className="cursor-pointer"
                  onClick={() =>
                    setExpandedId(expandedId === appt.id ? null : appt.id)
                  }
                >
                  <td className="font-mono text-sm">{appt.id}</td>
                  <td className="font-medium">{appt.patient_name}</td>
                  <td>{appt.slot_details.doctor_name}</td>
                  <td>{formatDate(appt.slot_details.start_time)}</td>
                  <td>
                    {formatTime(appt.slot_details.start_time)} —{" "}
                    {formatTime(appt.slot_details.end_time)}
                  </td>
                  <td>
                    <span className={STATUS_STYLES[appt.status]}>
                      {appt.status}
                    </span>
                  </td>
                  <td className="max-w-xs truncate text-base-content/60">
                    {appt.doctor_notes || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
