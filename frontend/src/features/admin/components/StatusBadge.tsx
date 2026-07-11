import type { AdminUser } from "../types";

export function StatusBadge({ user }: { user: AdminUser }) {
  if (user.is_blocked) {
    return <span className="badge badge-outline badge-error">Blocked</span>;
  }
  if (!user.is_approved) {
    return <span className="badge badge-outline badge-warning">Pending</span>;
  }
  return <span className="badge badge-outline badge-success">Approved</span>;
}
