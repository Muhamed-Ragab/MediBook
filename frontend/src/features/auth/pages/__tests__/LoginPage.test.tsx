import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import LoginPage from "../LoginPage";
import { useAuthStore } from "../../../../shared/stores/authStore";

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
});
