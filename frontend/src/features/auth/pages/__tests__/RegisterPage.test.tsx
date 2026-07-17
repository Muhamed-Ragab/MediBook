import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import RegisterPage from "@/features/auth/pages/RegisterPage";

const queryClient = new QueryClient();

describe("RegisterPage", () => {
  it("should render registration form", () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <RegisterPage />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText("Create account")).toBeTruthy();
    expect(screen.getByText("Create Account")).toBeTruthy();
    expect(screen.getByText("Patient")).toBeTruthy();
    expect(screen.getByText("Doctor")).toBeTruthy();
    expect(screen.getByText(/Already have an account/)).toBeTruthy();
  });
});
