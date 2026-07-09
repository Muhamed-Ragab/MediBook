export type Role = "admin" | "doctor" | "patient";

export interface User {
  id: number;
  username: string;
  email: string;
  role: Role;
}
