import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/utils/api";
import type {
  Appointment,
  AvailableSlot,
  BookingResponse,
  DoctorListItem,
} from "../types";

export function useDoctors(search?: string, specialty?: string) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (specialty) params.set("specialty", specialty);
  const qs = params.toString();

  return useQuery<DoctorListItem[]>({
    queryKey: ["doctors", search, specialty],
    queryFn: () =>
      api.get<DoctorListItem[]>(`/doctors/${qs ? `?${qs}` : ""}`),
  });
}

export function useAvailableSlots(
  doctorId: number,
  from: string,
  to: string,
) {
  return useQuery<AvailableSlot[]>({
    queryKey: ["available-slots", doctorId, from, to],
    queryFn: () =>
      api.get<AvailableSlot[]>(
        `/doctors/${doctorId}/available-slots/?from=${from}&to=${to}`,
      ),
    enabled: !!doctorId && !!from && !!to,
  });
}

export function useBookAppointment() {
  const queryClient = useQueryClient();
  return useMutation<BookingResponse, Error, { slot: number }>({
    mutationFn: (data) =>
      api.post<BookingResponse>("/appointments/", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["available-slots"] });
    },
  });
}

export function useAppointments() {
  return useQuery<Appointment[]>({
    queryKey: ["appointments"],
    queryFn: () => api.get<Appointment[]>("/appointments/"),
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();
  return useMutation<Appointment, Error, number>({
    mutationFn: (id) =>
      api.patch<Appointment>(`/appointments/${id}/status/`, { status: "Cancelled" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();
  return useMutation<Appointment, Error, { id: number; status: string }>({
    mutationFn: ({ id, status }) =>
      api.patch<Appointment>(`/appointments/${id}/status/`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    },
  });
}
