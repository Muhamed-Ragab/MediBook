import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import RegisterPage from "../RegisterPage";

describe("RegisterPage", () => {
  it("should render registration form", () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Create account")).toBeTruthy();
    expect(screen.getByText("Create Account")).toBeTruthy();
    expect(screen.getByText("Patient")).toBeTruthy();
    expect(screen.getByText("Doctor")).toBeTruthy();
    expect(screen.getByText(/Already have an account/)).toBeTruthy();
  });
});
