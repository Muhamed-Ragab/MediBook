import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { verifyEmailApi } from "@/features/auth/api";
import type { VerifyEmailStatus } from "@/features/auth/types";

export function useVerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<VerifyEmailStatus>("loading");
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

  return { status, message };
}
