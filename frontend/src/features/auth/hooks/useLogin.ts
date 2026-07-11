import { useState } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginApi } from "@/features/auth/api";
import { useAuthStore } from "@/shared/stores/authStore";
import { loginSchema } from "@/features/auth/constants";
import type { LoginForm } from "@/features/auth/types";

export function useLogin() {
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

  return { register, handleSubmit: handleSubmit(onSubmit), errors, serverError, isSubmitting };
}

