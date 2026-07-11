import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/utils/api";
import type { AdminUser, Specialty, SpecialtyFormData, UserUpdateData, DashboardStats } from "../types";

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

export function useSpecialties() {
  return useQuery<Specialty[]>({
    queryKey: ["admin", "specialties"],
    queryFn: () => api.get<Specialty[]>("/specialties/"),
  });
}

export function useCreateSpecialty() {
  const queryClient = useQueryClient();
  return useMutation<Specialty, Error, SpecialtyFormData>({
    mutationFn: (data) => api.post<Specialty>("/specialties/", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "specialties"] });
    },
  });
}

export function useUpdateSpecialty() {
  const queryClient = useQueryClient();
  return useMutation<Specialty, Error, { id: number; data: SpecialtyFormData }>({
    mutationFn: ({ id, data }) =>
      api.patch<Specialty>(`/specialties/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "specialties"] });
    },
  });
}

export function useDeleteSpecialty() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (id) => api.delete(`/specialties/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "specialties"] });
    },
  });
}
