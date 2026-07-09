import { Outlet, Link } from "react-router";

export function Component() {
  return (
    <div className="min-h-screen bg-base-200">
      <div className="navbar bg-base-100 shadow-sm">
        <div className="navbar-start">
          <Link to="/" className="btn btn-ghost text-xl">
            MediBook
          </Link>
        </div>
        <div className="navbar-end">
          <Link to="/login" className="btn btn-soft btn-primary">
            Login
          </Link>
        </div>
      </div>
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
