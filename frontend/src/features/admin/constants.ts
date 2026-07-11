import type { AdminUser } from "./types";

export const ROLE_BADGE_STYLES: Record<AdminUser["role"], string> = {
  admin: "badge badge-error",
  doctor: "badge badge-primary",
  patient: "badge badge-ghost",
};
