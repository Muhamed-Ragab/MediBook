import { Link, Outlet } from "react-router";
import { useAuthStore } from "../stores/authStore";

export function Component() {
  const { user, token } = useAuthStore();
  const isAuthenticated = !!token;

  return (
    <div className="min-h-screen bg-base-200 flex flex-col">
      {/* Navbar */}
      <header className="bg-base-100 border-b border-base-300 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
              <svg viewBox="0 0 24 24" className="w-7 h-7 fill-current" aria-hidden="true">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15H9v-4H5v-2h4V7h2v4h4v2h-4v4z" />
              </svg>
              MediBook
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              <Link to="/" className="btn btn-ghost btn-sm text-base-content/70 hover:text-base-content">
                Home
              </Link>
              {isAuthenticated ? (
                <div className="flex items-center gap-2 ml-4">
                  <Link
                    to={`/${user?.role}`}
                    className="btn btn-ghost btn-sm text-base-content/70 hover:text-base-content"
                  >
                    Dashboard
                  </Link>
                </div>
              ) : (
                <div className="flex items-center gap-2 ml-4">
                  <Link to="/login" className="btn btn-ghost btn-sm text-base-content/70 hover:text-base-content">
                    Sign In
                  </Link>
                  <Link to="/register" className="btn btn-primary btn-sm">
                    Get Started
                  </Link>
                </div>
              )}
            </nav>

            {/* Mobile menu toggle */}
            <details className="dropdown dropdown-end md:hidden">
              <summary className="btn btn-ghost btn-sm btn-square" aria-label="Toggle navigation menu">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
                  <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
              </summary>
              <ul className="dropdown-content menu bg-base-100 rounded-box shadow-sm border border-base-200 w-52 mt-2 p-2">
                <li><Link to="/">Home</Link></li>
                {isAuthenticated ? (
                  <li><Link to={`/${user?.role}`}>Dashboard</Link></li>
                ) : (
                  <>
                    <li><Link to="/login">Sign In</Link></li>
                    <li><Link to="/register">Get Started</Link></li>
                  </>
                )}
              </ul>
            </details>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-base-100 border-t border-base-300 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-base-content/50">
          &copy; {new Date().getFullYear()} MediBook. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
