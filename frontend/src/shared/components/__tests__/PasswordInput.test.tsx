import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PasswordInput } from "@/shared/components/PasswordInput";

describe("PasswordInput", () => {
  it("toggles input type between password and text", () => {
    render(<PasswordInput id="pw" placeholder="Password" />);
    const input = screen.getByPlaceholderText("Password") as HTMLInputElement;
    expect(input.type).toBe("password");

    fireEvent.click(screen.getByRole("button", { name: /show password/i }));
    expect(input.type).toBe("text");

    fireEvent.click(screen.getByRole("button", { name: /hide password/i }));
    expect(input.type).toBe("password");
  });

  it("forwards ref and extra props", () => {
    render(<PasswordInput id="pw" name="password" placeholder="Password" />);
    const input = screen.getByPlaceholderText("Password") as HTMLInputElement;
    expect(input.name).toBe("password");
  });
});
