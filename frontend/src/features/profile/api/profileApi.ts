import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/utils/api";
import { useAuthStore } from "@/shared/stores/authStore";

// ── Types ────────────────────────────────────────────────────────────────────

export interface MeResponseData {
  id: number;
  username: string;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  is_approved: boolean;
  is_blocked: boolean;
  email_verified: boolean;
  doctor_profile: DoctorProfileData | null;
  patient_profile: PatientProfileData | null;
}

export interface DoctorProfileData {
  id: number;
  specialty: string;
  bio: string;
  phone: string;
  photo_url: string;
}

export interface PatientProfileData {
  id: number;
  phone: string;
  date_of_birth: string | null;
  emergency_contact: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | Record<string, string[]> | null;
}

// ── Fetch wrappers ───────────────────────────────────────────────────────────

async function getMe(): Promise<MeResponseData> {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error("Not authenticated");

  const res = await fetch("http://localhost:8000/api/auth/me/", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json: ApiResponse<MeResponseData> = await res.json();
  if (!json.success || !json.data) {
    throw new Error(
      typeof json.error === "string" ? json.error : "Failed to fetch profile"
    );
  }
  return json.data;
}

// ── Doctor profile hooks ─────────────────────────────────────────────────────

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    staleTime: 30_000,
  });
}

export function useDoctorProfile() {
  return useQuery({
    queryKey: ["me", "doctor-profile"],
    queryFn: async () => {
      const data = await getMe();
      if (!data.doctor_profile) throw new Error("No doctor profile found");
      return data.doctor_profile;
    },
    staleTime: 30_000,
  });
}

export function useUpdateDoctorProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<Pick<DoctorProfileData, "bio" | "phone" | "photo_url">>;
    }) => {
      return api.patch<DoctorProfileData>(`/doctors/${id}/`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}

// ── Patient profile hooks ────────────────────────────────────────────────────

export function usePatientProfile() {
  return useQuery({
    queryKey: ["me", "patient-profile"],
    queryFn: async () => {
      const data = await getMe();
      if (!data.patient_profile) throw new Error("No patient profile found");
      return data.patient_profile;
    },
    staleTime: 30_000,
  });
}

export function useUpdatePatientProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<
        Pick<PatientProfileData, "phone" | "date_of_birth" | "emergency_contact">
      >;
    }) => {
      return api.patch<PatientProfileData>(`/patients/${id}/`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
}
