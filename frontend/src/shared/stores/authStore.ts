import { create } from "zustand";
import type { Role } from "../types";

interface UserInfo {
  id: number;
  username: string;
  email: string;
  first_name: string;
  role: Role;
}

interface AuthState {
  user: UserInfo | null;
  token: string | null;
  login: (token: string, user: UserInfo) => void;
  logout: () => void;
  setUser: (user: UserInfo) => void;
}

function loadPersistedUser(): UserInfo | null {
  try {
    const raw = localStorage.getItem("user");
    return raw ? (JSON.parse(raw) as UserInfo) : null;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: loadPersistedUser(),
  token: localStorage.getItem("token"),
  login: (token, user) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ token: null, user: null });
  },
  setUser: (user) => {
    localStorage.setItem("user", JSON.stringify(user));
    set({ user });
  },
}));
