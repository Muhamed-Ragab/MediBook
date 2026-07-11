import { Link } from "react-router";
import { PasswordInput } from "@/shared/components/PasswordInput";
import { useLogin } from "@/features/auth/hooks/useLogin";

export default function LoginPage() {
  const { register, handleSubmit, errors, serverError, isSubmitting } = useLogin();

  return (
    <div className="card-body p-6 md:p-8">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-base-content">Welcome back</h1>
        <p className="text-sm text-base-content/50 mt-1">
          Sign in to your MediBook account
        </p>
      </div>

      {/* Server error */}
      {serverError && (
        <div className="alert alert-error text-sm py-2 mb-4" role="alert">
          <span>{serverError}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
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

        {/* Password */}
        <fieldset className="form-control">
          <label className="label py-1" htmlFor="password">
            <span className="label-text text-sm font-medium">Password</span>
          </label>
          <PasswordInput
            id="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            hasError={!!errors.password}
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-error mt-1">{errors.password.message}</p>
          )}
        </fieldset>

        {/* Submit */}
        <button
          type="submit"
          className="btn btn-primary w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="loading loading-spinner loading-sm" />
          ) : null}
          Sign In
        </button>
      </form>

      {/* Divider */}
      <div className="divider text-xs text-base-content/30 my-4">OR</div>

      {/* Register link */}
      <p className="text-center text-sm text-base-content/50">
        Don't have an account?{" "}
        <Link to="/register" className="text-primary font-medium hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}

