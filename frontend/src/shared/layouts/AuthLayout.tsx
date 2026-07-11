import { Outlet, Link } from "react-router";

const YEAR = new Date().getFullYear();

export function Component() {
  return (
    <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center px-4 py-12">
      {/* Logo link */}
      <Link
        to="/"
        className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight mb-8"
      >
        <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current" aria-hidden="true">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15H9v-4H5v-2h4V7h2v4h4v2h-4v4z" />
        </svg>
        MediBook
      </Link>

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
