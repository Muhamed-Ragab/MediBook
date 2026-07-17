export type Role = "admin" | "doctor" | "patient";

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  role: Role;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | Record<string, string[]> | null;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface Specialty {
  id: number;
  name: string;
  description: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  role: "doctor" | "patient";
  first_name?: string;
  last_name?: string;
  specialty?: string;
  bio?: string;
  phone?: string;
  date_of_birth?: string;
}
