import { useCallback } from "react";
import { useAuthStore } from "../stores/authStore";
import type { Role } from "../types";

export function useAuth() {
  const { user, token, login, logout } = useAuthStore();

  const isAuthenticated = !!token;
  const userRole = user?.role ?? null;

  const loginUser = useCallback(
    (token: string, user: { id: number; username: string; email: string; first_name: string; role: Role }) => {
      login(token, user);
    },
    [login]
  );

  const logoutUser = useCallback(() => {
    logout();
  }, [logout]);

  return {
    user,
    token,
    isAuthenticated,
    userRole,
    login: loginUser,
    logout: logoutUser,
  };
}
