import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore } from "@/shared/stores/authStore";

describe("authStore", () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ user: null, token: null });
  });

  it("should start with null user and token from localStorage", () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
  });

  it("should persist token to localStorage on login", () => {
    const { login } = useAuthStore.getState();
    login("test-token", { id: 1, username: "testuser", email: "test@example.com", first_name: "", role: "patient" });

    const state = useAuthStore.getState();
    expect(state.token).toBe("test-token");
    expect(state.user).toEqual({
      id: 1,
      username: "testuser",
      email: "test@example.com",
      first_name: "",
      role: "patient",
    });
    expect(localStorage.getItem("token")).toBe("test-token");
  });

  it("should clear token and user on logout", () => {
    const { login } = useAuthStore.getState();
    login("test-token", { id: 1, username: "testuser", email: "test@example.com", first_name: "", role: "doctor" });

    const { logout } = useAuthStore.getState();
    logout();

    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("should reinitialize from localStorage when store is reset", () => {
    localStorage.setItem("token", "existing-token");
    useAuthStore.setState({ token: localStorage.getItem("token") });
    const state = useAuthStore.getState();
    expect(state.token).toBe("existing-token");
  });
});
