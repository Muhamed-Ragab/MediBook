import { useState } from "react";
import { useUpdateUser } from "../api/adminApi";
import { useAuthStore } from "@/shared/stores/authStore";
import type { AdminUser, UserUpdateData } from "../types";

export function useAdminUsers() {
  const updateUser = useUpdateUser();
  const currentUser = useAuthStore((s) => s.user);
  const [actionUserId, setActionUserId] = useState<number | null>(null);

  const handleToggle = (user: AdminUser) => {
    setActionUserId(user.id);
    let data: UserUpdateData;

    if (user.is_blocked) {
      data = { is_blocked: false };
    } else if (!user.is_approved) {
      data = { is_approved: true, is_blocked: false };
    } else {
      data = { is_blocked: true };
    }

    updateUser.mutate(
      { id: user.id, data },
      { onSettled: () => setActionUserId(null) },
    );
  };

  return { updateUser, currentUser, actionUserId, handleToggle };
}
