import { Outlet, Navigate } from "react-router";
import { useAuthStore } from "@/shared/stores/authStore";

const YEAR = new Date().getFullYear();

export function Component() {
  const { token, user } = useAuthStore();

  // Already authenticated — send to their dashboard
  if (token && user) {
    return <Navigate to={`/${user.role}`} replace />;
  }
  return (
    <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center px-4 py-12">
      {/* Card */}
      <div className="w-full max-w-md bg-base-100 rounded-box shadow-sm border border-base-200/60">
        <Outlet />
      </div>

      <p className="text-sm text-base-content/40 mt-6">
        &copy; {YEAR} MediBook
      </p>
    </div>
  );
}
