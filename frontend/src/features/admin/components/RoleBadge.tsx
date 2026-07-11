import { ROLE_BADGE_STYLES } from "../constants";
import type { AdminUser } from "../types";

export function RoleBadge({ role }: { role: AdminUser["role"] }) {
  return <span className={ROLE_BADGE_STYLES[role] ?? "badge"}>{role}</span>;
}
