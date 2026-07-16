import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/utils/api";
import type {
  AvailabilitySlot,
  BulkCreateResponse,
  SlotFormData,
} from "../types";

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

export function useSlots(doctorId: number, from: Date, to: Date) {
  const fromStr = formatDate(from);
  const toStr = formatDate(to);
  return useQuery<AvailabilitySlot[]>({
    queryKey: ["slots", doctorId, fromStr, toStr],
    queryFn: () =>
      api.get<AvailabilitySlot[]>(
        `/doctors/${doctorId}/slots/?from=${fromStr}&to=${toStr}`,
      ),
    enabled: !!doctorId,
  });
}

export function useCreateSlot(doctorId: number) {
  const queryClient = useQueryClient();
  return useMutation<AvailabilitySlot, Error, SlotFormData>({
    mutationFn: (data) =>
      api.post<AvailabilitySlot>(`/doctors/${doctorId}/slots/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slots", doctorId] });
    },
  });
}

export function useBulkCreateSlots(doctorId: number) {
  const queryClient = useQueryClient();
  return useMutation<BulkCreateResponse, Error, SlotFormData[]>({
    mutationFn: (data) =>
      api.post<BulkCreateResponse>(`/doctors/${doctorId}/slots/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slots", doctorId] });
    },
  });
}

export function useDeleteSlot(doctorId: number) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: (slotId) =>
      api.delete(`/doctors/${doctorId}/slots/${slotId}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["slots", doctorId] });
    },
  });
}
