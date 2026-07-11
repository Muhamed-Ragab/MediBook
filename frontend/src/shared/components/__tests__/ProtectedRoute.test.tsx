import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router";
import ProtectedRoute from "@/shared/components/ProtectedRoute";
import { useAuthStore } from "@/shared/stores/authStore";

function TestChild() {
  return <div>Protected Content</div>;
}

function LoginPage() {
  return <div>Login Page</div>;
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null });
  });

  it("should redirect to /login when not authenticated", () => {
    render(
      <MemoryRouter initialEntries={["/protected"]}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <TestChild />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Login Page")).toBeTruthy();
  });

  it("should render children when authenticated", () => {
    useAuthStore.setState({
      token: "test-token",
      user: { id: 1, username: "test", email: "test@example.com", first_name: "", role: "patient" },
    });

    render(
      <MemoryRouter initialEntries={["/protected"]}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <TestChild />
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Protected Content")).toBeTruthy();
  });

  it("should redirect to role dashboard on role mismatch", () => {
    useAuthStore.setState({
      token: "test-token",
      user: { id: 1, username: "test", email: "test@example.com", first_name: "", role: "patient" },
    });

    render(
      <MemoryRouter initialEntries={["/protected"]}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute allowedRoles={["doctor"]}>
                <TestChild />
              </ProtectedRoute>
            }
          />
          <Route path="/patient" element={<div>Patient Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Patient Dashboard")).toBeTruthy();
  });
});
