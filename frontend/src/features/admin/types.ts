export interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: "admin" | "doctor" | "patient";
  first_name: string;
  last_name: string;
  is_approved: boolean;
  is_blocked: boolean;
  email_verified: boolean;
}

// Public catalog type lives in shared; re-exported here for backward compatibility.
export type { Specialty } from "@/shared/types";

export interface SpecialtyFormData {
  name: string;
  description?: string;
}

export interface UserUpdateData {
  is_approved?: boolean;
  is_blocked?: boolean;
}

export interface DashboardStats {
  total_users: number;
  total_doctors: number;
  total_patients: number;
}

export type ModalMode = "add" | "edit" | null;
