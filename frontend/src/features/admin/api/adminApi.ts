import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/utils/api";
import { useSpecialties } from "@/shared/api/specialties";
import type { AdminUser, Specialty, SpecialtyFormData, UserUpdateData, DashboardStats } from "../types";

// Re-exported so existing admin code and tests keep importing from this module.
export { useSpecialties };
export type { Specialty };

export function useUsers() {
  return useQuery<AdminUser[]>({
    queryKey: ["admin", "users"],
    queryFn: () => api.get<AdminUser[]>("/users/"),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, { id: number; data: UserUpdateData }>({
    mutationFn: ({ id, data }) =>
      api.patch(`/users/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ["admin", "stats"],
    queryFn: () => api.get<DashboardStats>("/users/stats/"),
  });
}

export function useCreateSpecialty() {
  const queryClient = useQueryClient();
  return useMutation<Specialty, Error, SpecialtyFormData>({
    mutationFn: (data) => api.post<Specialty>("/specialties/", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["specialties"] });
    },
  });
}

export function useUpdateSpecialty() {
  const queryClient = useQueryClient();
  return useMutation<Specialty, Error, { id: number; data: SpecialtyFormData }>({
    mutationFn: ({ id, data }) =>
      api.patch<Specialty>(`/specialties/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["specialties"] });
    },
  });
}

export function useDeleteSpecialty() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (id) => api.delete(`/specialties/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["specialties"] });
    },
  });
}
