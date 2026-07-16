export interface AvailabilitySlot {
  id: number;
  start_time: string;
  end_time: string;
  is_booked: boolean;
  doctor: number;
}

export interface SlotFormData {
  start_time: string;
  end_time: string;
}

export interface BulkCreateResponse {
  created: AvailabilitySlot[];
  rejected: { data: SlotFormData; errors: Record<string, string[]> }[];
}

export interface WeekDay {
  date: string;
  dayName: string;
  dayNumber: number;
}

export type TimeBlock = `${number}:${number}`;
