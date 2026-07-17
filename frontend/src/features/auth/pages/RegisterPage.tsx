import { Link } from "react-router";
import { useRegister } from "@/features/auth/hooks/useRegister";
import { PasswordInput } from "@/shared/components/PasswordInput";

export default function RegisterPage() {
  const {
    role,
    serverError,
    isSubmitting,
    isSuccess,
    register,
    handleSubmit,
    errors,
    handleRoleChange,
    specialties,
    specialtiesLoading,
  } = useRegister();

  if (isSuccess) {
    return (
      <div className="card-body p-6 md:p-8 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-4">
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-success fill-current">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-base-content">Check your email</h2>
        <p className="text-sm text-base-content/50 mt-2 leading-relaxed">
          We've sent a verification link to your email address. Please check your
          inbox and click the link to activate your account.
        </p>
        <Link to="/login" className="btn btn-primary mt-6">
          Go to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="card-body p-6 md:p-8">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-base-content">Create account</h1>
        <p className="text-sm text-base-content/50 mt-1">
          Join MediBook as a patient or doctor
        </p>
      </div>

      {serverError && (
        <div className="alert alert-error text-sm py-2 mb-4" role="alert">
          <span>{serverError}</span>
        </div>
      )}

      <div className="flex gap-2 mb-6 bg-base-200 p-1 rounded-lg">
        <button
          type="button"
          onClick={() => handleRoleChange("patient")}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
            role === "patient"
              ? "bg-base-100 text-base-content shadow-sm"
              : "text-base-content/50 hover:text-base-content"
          }`}
        >
          Patient
        </button>
        <button
          type="button"
          onClick={() => handleRoleChange("doctor")}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
            role === "doctor"
              ? "bg-base-100 text-base-content shadow-sm"
              : "text-base-content/50 hover:text-base-content"
          }`}
        >
          Doctor
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <fieldset className="form-control">
            <label className="label py-1" htmlFor="first_name">
              <span className="label-text text-sm font-medium">First name</span>
            </label>
            <input
              id="first_name"
              type="text"
              placeholder="John"
              className="input input-bordered w-full text-sm"
              {...register("first_name")}
            />
          </fieldset>
          <fieldset className="form-control">
            <label className="label py-1" htmlFor="last_name">
              <span className="label-text text-sm font-medium">Last name</span>
            </label>
            <input
              id="last_name"
              type="text"
              placeholder="Doe"
              className="input input-bordered w-full text-sm"
              {...register("last_name")}
            />
          </fieldset>
        </div>

        <fieldset className="form-control">
          <label className="label py-1" htmlFor="email">
            <span className="label-text text-sm font-medium">Email</span>
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            className={`input input-bordered w-full text-sm ${
              errors.email ? "input-error" : ""
            }`}
            autoComplete="email"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-error mt-1">{errors.email.message}</p>
          )}
        </fieldset>

        <fieldset className="form-control">
          <label className="label py-1" htmlFor="phone">
            <span className="label-text text-sm font-medium">Phone</span>
          </label>
          <input
            id="phone"
            type="tel"
            placeholder="+1 (555) 123-4567"
            className="input input-bordered w-full text-sm"
            {...register("phone")}
          />
        </fieldset>

        {role === "doctor" && (
          <fieldset className="form-control">
            <label className="label py-1" htmlFor="specialty">
              <span className="label-text text-sm font-medium">Specialty</span>
            </label>
            {specialtiesLoading ? (
              <select className="select select-bordered w-full text-sm" disabled>
                <option>Loading specialties...</option>
              </select>
            ) : (
              <select
                id="specialty"
                className={`select select-bordered w-full text-sm ${errors.specialty ? "select-error" : ""}`}
                defaultValue=""
                {...register("specialty")}
              >
                <option value="" disabled>Select a specialty</option>
                {specialties?.map((s) => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
              </select>
            )}
            {errors.specialty && (
              <p className="text-xs text-error mt-1">{errors.specialty.message}</p>
            )}
          </fieldset>
        )}

        <fieldset className="form-control">
          <label className="label py-1" htmlFor="password">
            <span className="label-text text-sm font-medium">Password</span>
          </label>
          <PasswordInput
            id="password"
            placeholder="At least 8 characters"
            autoComplete="new-password"
            hasError={!!errors.password}
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-error mt-1">{errors.password.message}</p>
          )}
        </fieldset>

        <fieldset className="form-control">
          <label className="label py-1" htmlFor="confirmPassword">
            <span className="label-text text-sm font-medium">Confirm password</span>
          </label>
          <PasswordInput
            id="confirmPassword"
            placeholder="Repeat your password"
            autoComplete="new-password"
            hasError={!!errors.confirmPassword}
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="text-xs text-error mt-1">
              {errors.confirmPassword.message}
            </p>
          )}
        </fieldset>

        <button
          type="submit"
          className="btn btn-primary w-full mt-2"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="loading loading-spinner loading-sm" />
          ) : null}
          Create Account
        </button>
      </form>

      <p className="text-center text-sm text-base-content/50 mt-6">
        Already have an account?{" "}
        <Link to="/login" className="text-primary font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
