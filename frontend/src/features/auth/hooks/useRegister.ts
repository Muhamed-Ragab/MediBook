import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerApi } from "@/features/auth/api";
import { registerSchema } from "../constants";
import type { RegisterForm } from "../types";

export function useRegister() {
  const [role, setRole] = useState<"doctor" | "patient">("patient");
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: "patient" },
  });

  const handleRoleChange = (newRole: "doctor" | "patient") => {
    setRole(newRole);
    setValue("role", newRole);
  };

  const onSubmit = async (data: RegisterForm) => {
    setServerError(null);
    setIsSubmitting(true);
    try {
      const response = await registerApi({
        email: data.email,
        password: data.password,
        role: data.role,
        first_name: data.first_name || undefined,
        last_name: data.last_name || undefined,
        specialty: data.role === "doctor" ? data.specialty || "" : undefined,
        phone: data.phone || undefined,
      });
      if (response.success) {
        setIsSuccess(true);
      } else {
        let errorMsg = "Registration failed. Please try again.";
        if (typeof response.error === "string") {
          errorMsg = response.error;
        } else if (response.error && typeof response.error === "object") {
          const msgs = Object.values(response.error).flat().filter(Boolean);
          if (msgs.length > 0) errorMsg = msgs.join(". ");
        }
        setServerError(errorMsg);
      }
    } catch {
      setServerError("Connection error. Please check your network.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    role,
    serverError,
    isSubmitting,
    isSuccess,
    register,
    handleSubmit: handleSubmit(onSubmit),
    errors,
    handleRoleChange
  };
}
