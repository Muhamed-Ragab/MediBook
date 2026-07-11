import { Link } from "react-router";
import { useAuthStore } from "@/shared/stores/authStore";

const features = [
  {
    title: "Find the right doctor",
    description:
      "Search by specialty, location, or name to find the perfect doctor for your needs.",
    icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  },
  {
    title: "Book in seconds",
    description:
      "See real-time availability and book appointments instantly. No phone calls, no back-and-forth.",
    icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  },
  {
    title: "Manage your care",
    description:
      "View upcoming appointments, reschedule if needed, and keep your health information in one place.",
    icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
  },
];

const steps = [
  {
    step: "1",
    title: "Create your account",
    description: "Sign up as a patient or doctor in under a minute.",
  },
  {
    step: "2",
    title: "Find a doctor",
    description: "Search by specialty and see real-time availability.",
  },
  {
    step: "3",
    title: "Book your visit",
    description: "Pick a time that works for you and confirm instantly.",
  },
];

export default function HomePage() {
  const token = useAuthStore((s) => s.token);
  const isAuthenticated = !!token;

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 lg:py-32">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              Medical appointment booking
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-base-content tracking-tight leading-[1.1] text-balance">
              Healthcare{" "}
              <span className="text-primary">made simple</span>
            </h1>
            <p className="mt-5 text-base sm:text-lg text-base-content/60 leading-relaxed max-w-lg">
              Book appointments with trusted doctors in seconds. No phone calls,
              no waiting — just the care you need, when you need it.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              {isAuthenticated ? (
                <Link to="/patient" className="btn btn-primary btn-lg px-8">
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn btn-primary btn-lg px-8">
                    Get Started
                  </Link>
                  <Link
                    to="/login"
                    className="btn btn-ghost btn-lg px-8 text-base-content/60 hover:text-base-content"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
        {/* Subtle background decoration */}
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/[0.03] blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-primary/[0.02] blur-3xl pointer-events-none" />
      </section>

      {/* How it works */}
      <section className="bg-base-100 border-y border-base-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-base-content">
              How it works
            </h2>
            <p className="mt-2 text-sm text-base-content/50">
              Three simple steps to your next appointment
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((step) => (
              <div key={step.step} className="text-center">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center mx-auto mb-4">
                  {step.step}
                </div>
                <h3 className="text-base font-semibold text-base-content">
                  {step.title}
                </h3>
                <p className="text-sm text-base-content/50 mt-1.5 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-base-content">
            Everything you need
          </h2>
          <p className="mt-2 text-sm text-base-content/50">
            A seamless experience for patients and doctors alike
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-base-100 rounded-box border border-base-200/60 p-6"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <svg
                  viewBox="0 0 24 24"
                  className="w-5 h-5 text-primary fill-current"
                  aria-hidden="true"
                >
                  <path d={feature.icon} />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-base-content">
                {feature.title}
              </h3>
              <p className="text-sm text-base-content/50 mt-1.5 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      {!isAuthenticated && (
        <section className="bg-primary/5 border-y border-primary/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-base-content">
              Ready to get started?
            </h2>
            <p className="mt-2 text-sm text-base-content/50 max-w-md mx-auto">
              Join thousands of patients and doctors using MediBook for seamless
              appointment scheduling.
            </p>
            <Link
              to="/register"
              className="btn btn-primary btn-lg px-10 mt-8"
            >
              Create your free account
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
