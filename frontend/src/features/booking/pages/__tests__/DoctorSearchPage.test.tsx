import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import DoctorSearchPage from "@/features/booking/pages/DoctorSearchPage";

const mockUseDoctors = vi.fn();
vi.mock("@/features/booking/api/useDoctors", () => ({
  useDoctors: (...args: unknown[]) => mockUseDoctors(...args),
}));

vi.mock("@/features/admin/api/adminApi", () => ({
  useSpecialties: vi.fn(() => ({ data: [] })),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    );
  };
}

describe("DoctorSearchPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render search input and specialty filter", () => {
    mockUseDoctors.mockReturnValue({ data: [], isLoading: false });
    render(<DoctorSearchPage />, { wrapper: createWrapper() });

    expect(screen.getByRole("heading", { name: /find a doctor/i })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /search by name/i })).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("should show loading state initially", () => {
    mockUseDoctors.mockReturnValue({ data: [], isLoading: true });
    render(<DoctorSearchPage />, { wrapper: createWrapper() });

    expect(document.querySelector(".loading")).toBeInTheDocument();
  });

  it("should show empty state when no doctors", async () => {
    mockUseDoctors.mockReturnValue({ data: [], isLoading: false });
    render(<DoctorSearchPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("No doctors found")).toBeInTheDocument();
    });
  });

  it("should update search input on typing", () => {
    mockUseDoctors.mockReturnValue({ data: [], isLoading: false });
    render(<DoctorSearchPage />, { wrapper: createWrapper() });

    const input = screen.getByRole("textbox", { name: /search by name/i });
    fireEvent.change(input, { target: { value: "Smith" } });

    expect(input).toHaveValue("Smith");
  });
});
