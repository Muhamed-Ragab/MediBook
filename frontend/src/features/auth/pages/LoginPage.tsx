import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginApi } from "../api";
import { useAuthStore } from "../../../shared/stores/authStore";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setServerError(null);
    setIsSubmitting(true);
    try {
      const response = await loginApi(data);
      if (response.success && response.data) {
        login(response.data.access, {
          id: response.data.user.id,
          username: response.data.user.username,
          email: response.data.user.email,
          first_name: response.data.user.first_name,
          role: response.data.user.role as "admin" | "doctor" | "patient",
        });
        navigate(`/${response.data.user.role}`, { replace: true });
      } else {
        const errorMsg =
          typeof response.error === "string"
            ? response.error
            : "Invalid credentials. Please try again.";
        setServerError(errorMsg);
      }
    } catch {
      setServerError("Connection error. Please check your network.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            className={`input input-bordered w-full text-sm ${
              errors.password ? "input-error" : ""
            }`}
            autoComplete="current-password"
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
