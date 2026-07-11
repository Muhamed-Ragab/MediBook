import { Link } from "react-router";
import { useUsers } from "@/features/admin/api/adminApi";

export default function AdminDashboard() {
  const { data: users, isLoading } = useUsers();

  const totalUsers = users?.length ?? 0;
  const totalDoctors = users?.filter((u) => u.role === "doctor").length ?? 0;
  const totalPatients = users?.filter((u) => u.role === "patient").length ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-base-content/60 mt-1">System overview and management</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      ) : (
        <>
          <div className="stats stats-vertical sm:stats-horizontal shadow w-full">
            <div className="stat">
              <div className="stat-title">Total Users</div>
              <div className="stat-value text-primary">{totalUsers}</div>
              <div className="stat-desc">All registered accounts</div>
            </div>
            <div className="stat">
              <div className="stat-title">Total Doctors</div>
              <div className="stat-value text-secondary">{totalDoctors}</div>
              <div className="stat-desc">Medical professionals</div>
            </div>
            <div className="stat">
              <div className="stat-title">Total Patients</div>
              <div className="stat-value text-accent">{totalPatients}</div>
              <div className="stat-desc">Patients</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/admin/users"
              className="card bg-base-100 shadow-sm border border-base-200 hover:border-primary/30 transition-colors p-6"
            >
              <div className="card-body p-0">
                <h3 className="card-title text-lg">Manage Users</h3>
                <p className="text-base-content/60 text-sm">
                  View, approve, and block user accounts
                </p>
              </div>
            </Link>
            <Link
              to="/admin/specialties"
              className="card bg-base-100 shadow-sm border border-base-200 hover:border-primary/30 transition-colors p-6"
            >
              <div className="card-body p-0">
                <h3 className="card-title text-lg">Manage Specialties</h3>
                <p className="text-base-content/60 text-sm">
                  Add, edit, and remove medical specialties
                </p>
              </div>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
