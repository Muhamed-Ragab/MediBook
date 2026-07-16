import type { DoctorListItem } from "../types";

interface DoctorCardProps {
  doctor: DoctorListItem;
  onClick: (id: number) => void;
}

export default function DoctorCard({ doctor, onClick }: DoctorCardProps) {
  const nextDate = doctor.next_available
    ? new Date(doctor.next_available).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <button
      type="button"
      className="card card-bordered bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer text-left w-full"
      onClick={() => onClick(doctor.id)}
    >
      <div className="card-body p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="card-title text-base">
              Dr. {doctor.name}
            </h3>
            <p className="badge badge-primary badge-outline mt-1">
              {doctor.specialty || "General"}
            </p>
          </div>
        </div>
        {doctor.bio && (
          <p className="text-sm text-base-content/70 mt-2 line-clamp-2">
            {doctor.bio}
          </p>
        )}
        {nextDate ? (
          <p className="text-xs text-success mt-2">
            Next available: {nextDate}
          </p>
        ) : (
          <p className="text-xs text-base-content/40 mt-2">
            No upcoming availability
          </p>
        )}
      </div>
    </button>
  );
}
