export interface DoctorListItem {
  id: number;
  name: string;
  specialty: string;
  bio: string;
  phone: string;
  photo_url: string;
  next_available: string | null;
}

export interface AvailableSlot {
  id: number;
  start_time: string;
  end_time: string;
  is_booked: boolean;
  doctor: number;
}

export interface Appointment {
  id: number;
  patient: number;
  patient_name: string;
  slot: number;
  slot_details: {
    id: number;
    doctor_name: string;
    start_time: string;
    end_time: string;
    is_booked: boolean;
  };
  status: "Pending" | "Confirmed" | "Completed" | "Cancelled";
  doctor_notes: string;
  created_at: string;
  updated_at: string;
}

export interface BookingResponse {
  success: boolean;
  data: Appointment;
  error: string | null;
  code?: string;
}

export interface Specialty {
  id: number;
  name: string;
  description: string;
}
