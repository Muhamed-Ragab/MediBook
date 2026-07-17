import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import userEvent from "@testing-library/user-event";
import LoginPage from "@/features/auth/pages/LoginPage";
import { useAuthStore } from "@/shared/stores/authStore";

// Track the last controller so tests can resolve/reject the fetch
let _resolveLogin: ((value: unknown) => void) | null = null;
vi.mock("@/features/auth/api", () => ({
  loginApi: vi.fn(() => new Promise((resolve) => {
    _resolveLogin = resolve;
  })),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, token: null });
  });

  it("should render login form", () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Welcome back")).toBeTruthy();
    expect(screen.getByText("Sign In")).toBeTruthy();
    expect(screen.getByText(/Don't have an account/)).toBeTruthy();
    expect(screen.getByLabelText("Email")).toBeTruthy();
    expect(screen.getByLabelText("Password")).toBeTruthy();
  });

  it("should show validation errors for empty fields", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(screen.getByText("Please enter a valid email address")).toBeTruthy();
    expect(screen.getByText("Password is required")).toBeTruthy();
  });

  it("should apply input-error class when validation fails", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await user.click(screen.getByRole("button", { name: /sign in/i }));

    const emailInput = screen.getByLabelText("Email");
    expect(emailInput.className).toContain("input-error");
  });

  it("should display server error on failed login", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "validPassword123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    _resolveLogin?.({
      success: false,
      data: null,
      error: "Invalid credentials.",
    });

    expect(
      await screen.findByText("Invalid credentials.")
    ).toBeTruthy();
  });

  it("should show submitting state while loading", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText("Email"), "test@example.com");
    await user.type(screen.getByLabelText("Password"), "validPassword123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(screen.getByRole("button", { name: /sign in/i })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /sign in/i }).querySelector(".loading")
    ).toBeTruthy();
  });

  it("should have link to register page", () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const link = screen.getByRole("link", { name: /sign up/i });
    expect(link).toHaveAttribute("href", "/register");
  });
});
