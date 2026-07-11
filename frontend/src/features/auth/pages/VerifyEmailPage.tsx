import { Link } from "react-router";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useVerifyEmail } from "@/features/auth/hooks/useVerifyEmail";

export default function VerifyEmailPage() {
  const { status, message } = useVerifyEmail();

  return (
    <div className="card bg-base-100 shadow-sm border border-base-200/60">
      <div className="card-body p-6 md:p-8 text-center">
        {status === "loading" && (
          <>
            <Loader2 size={36} className="animate-spin mx-auto text-base-content/30" />
            <h1 className="text-lg font-semibold mt-4 text-base-content">Verifying your email</h1>
            <p className="text-sm text-base-content/50 mt-1">Please wait...</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle size={36} className="mx-auto text-success" />
            <h1 className="text-lg font-semibold mt-4 text-base-content">Email verified</h1>
            <p className="text-sm text-base-content/50 mt-1">{message}</p>
            <Link to="/login" className="btn btn-primary mt-6">
              Sign In
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle size={36} className="mx-auto text-error" />
            <h1 className="text-lg font-semibold mt-4 text-base-content">Verification failed</h1>
            <p className="text-sm text-base-content/50 mt-1">{message}</p>
            <Link to="/login" className="btn btn-primary mt-6">
              Back to Sign In
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
