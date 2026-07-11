import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PatientProfilePage from "@/features/profile/pages/PatientProfilePage";

vi.mock("../../api/profileApi", () => ({
  usePatientProfile: vi.fn(),
  useUpdatePatientProfile: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
  })),
}));

import { usePatientProfile } from "@/features/profile/api/profileApi";
import type { PatientProfileData } from "@/features/profile/api/profileApi";

const mockProfile: PatientProfileData = {
  id: 1,
  phone: "+1 (555) 987-6543",
  date_of_birth: "1990-05-15",
  emergency_contact: "Jane Doe - +1 (555) 111-2222",
};

function Wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

function renderWithQuery(ui: React.ReactElement) {
  return render(<Wrapper>{ui}</Wrapper>);
}

describe("PatientProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show loading spinner when data is loading", () => {
    vi.mocked(usePatientProfile).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as ReturnType<typeof usePatientProfile>);

    renderWithQuery(<PatientProfilePage />);
    expect(document.querySelector(".loading-spinner")).toBeTruthy();
  });

  it("should show error state on fetch failure", () => {
    vi.mocked(usePatientProfile).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("No patient profile found"),
    } as ReturnType<typeof usePatientProfile>);

    renderWithQuery(<PatientProfilePage />);
    expect(screen.getByText("No patient profile found")).toBeTruthy();
  });

  it("should render profile form with fields", () => {
    vi.mocked(usePatientProfile).mockReturnValue({
      data: mockProfile,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof usePatientProfile>);

    renderWithQuery(<PatientProfilePage />);

    expect(screen.getByText("Edit Profile")).toBeTruthy();
    expect(screen.getByText("Phone")).toBeTruthy();
    expect(screen.getByText("Date of Birth")).toBeTruthy();
    expect(screen.getByText("Emergency Contact")).toBeTruthy();

    // Check values
    expect(screen.getByDisplayValue("+1 (555) 987-6543")).toBeTruthy();
    expect(screen.getByDisplayValue("1990-05-15")).toBeTruthy();
    expect(screen.getByDisplayValue("Jane Doe - +1 (555) 111-2222")).toBeTruthy();

    // Check buttons
    expect(screen.getByText("Save Changes")).toBeTruthy();
    expect(screen.getByText("Reset")).toBeTruthy();
  });

  it("should handle null date_of_birth gracefully", () => {
    vi.mocked(usePatientProfile).mockReturnValue({
      data: {
        id: 2,
        phone: "+1 (555) 333-4444",
        date_of_birth: null,
        emergency_contact: "",
      },
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof usePatientProfile>);

    renderWithQuery(<PatientProfilePage />);

    expect(screen.getByDisplayValue("+1 (555) 333-4444")).toBeTruthy();

    // Empty fields should show default empty values
    const phoneField = screen.getByDisplayValue("+1 (555) 333-4444");
    expect(phoneField).toBeTruthy();
  });
});
