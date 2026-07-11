import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePatientProfile, useUpdatePatientProfile } from "@/features/profile/api/profileApi";
import { patientProfileSchema } from "@/features/profile/constants";
import type { PatientProfileForm } from "@/features/profile/types";

export function usePatientProfileForm() {
  const { data: profile, isLoading, isError, error } = usePatientProfile();
  const updateMutation = useUpdatePatientProfile();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<PatientProfileForm>({
    resolver: zodResolver(patientProfileSchema),
  });

  useEffect(() => {
    if (profile) {
      reset({
        phone: profile.phone || "",
        date_of_birth: profile.date_of_birth || "",
        emergency_contact: profile.emergency_contact || "",
      });
    }
  }, [profile, reset]);

  const onSubmit = handleSubmit((data) => {
    if (!profile) return;
    updateMutation.mutate(
      { id: profile.id, data },
      { onSuccess: () => reset({}, { keepValues: true }) },
    );
  });

  return {
    profile,
    isLoading,
    isError,
    error,
    updateMutation,
    register,
    errors,
    isDirty,
    reset,
    onSubmit,
  };
}
