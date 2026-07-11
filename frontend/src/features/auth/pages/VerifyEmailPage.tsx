import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { verifyEmailApi } from "../api";

type Status = "loading" | "success" | "error";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");

  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

  useEffect(() => {
    if (!uid || !token) {
      setStatus("error");
      setMessage("Invalid verification link.");
      return;
    }

    verifyEmailApi(uid, token)
      .then(() => {
        setStatus("success");
        setMessage("Your email has been verified!");
      })
      .catch(() => {
        setStatus("error");
        setMessage("Verification failed. The link may be expired.");
      });
  }, [uid, token]);

  return (
    <div className="card bg-base-100 shadow-sm border border-base-200/60">
      <div className="card-body p-6 md:p-8 text-center">
        {status === "loading" && (
          <>
            <Loader2 size={36} className="animate-spin mx-auto text-base-content/30" />
            <h1 className="text-lg font-semibold mt-4" style={{ color: "var(--brand-dark)" }}>
              Verifying your email
            </h1>
            <p className="text-sm text-base-content/50 mt-1">Please wait...</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle size={36} className="mx-auto" style={{ color: "var(--brand)" }} />
            <h1 className="text-lg font-semibold mt-4" style={{ color: "var(--brand-dark)" }}>
              Email verified
            </h1>
            <p className="text-sm text-base-content/50 mt-1">{message}</p>
            <Link to="/login" className="btn btn-primary mt-6">
              Sign In
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle size={36} className="mx-auto text-error" />
            <h1 className="text-lg font-semibold mt-4" style={{ color: "var(--brand-dark)" }}>
              Verification failed
            </h1>
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
