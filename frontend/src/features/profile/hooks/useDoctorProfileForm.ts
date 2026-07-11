import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDoctorProfile, useUpdateDoctorProfile } from "@/features/profile/api/profileApi";
import { doctorProfileSchema } from "@/features/profile/constants";
import type { DoctorProfileForm } from "@/features/profile/types";

export function useDoctorProfileForm() {
  const { data: profile, isLoading, isError, error } = useDoctorProfile();
  const updateMutation = useUpdateDoctorProfile();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<DoctorProfileForm>({
    resolver: zodResolver(doctorProfileSchema),
  });

  useEffect(() => {
    if (profile) {
      reset({
        bio: profile.bio || "",
        phone: profile.phone || "",
        photo_url: profile.photo_url || "",
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
