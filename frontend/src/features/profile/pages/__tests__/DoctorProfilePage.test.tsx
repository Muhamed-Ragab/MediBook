import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import DoctorProfilePage from "@/features/profile/pages/DoctorProfilePage";

vi.mock("../../api/profileApi", () => ({
  useDoctorProfile: vi.fn(),
  useUpdateDoctorProfile: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
  })),
}));

import { useDoctorProfile } from "@/features/profile/api/profileApi";
import type { DoctorProfileData } from "@/features/profile/api/profileApi";

const mockProfile: DoctorProfileData = {
  id: 1,
  specialty: "Cardiology",
  bio: "Experienced cardiologist with 15 years of practice.",
  phone: "+1 (555) 123-4567",
  photo_url: "https://example.com/photo.jpg",
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

describe("DoctorProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show loading spinner when data is loading", () => {
    vi.mocked(useDoctorProfile).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as ReturnType<typeof useDoctorProfile>);

    renderWithQuery(<DoctorProfilePage />);
    expect(document.querySelector(".loading-spinner")).toBeTruthy();
  });

  it("should show error state on fetch failure", () => {
    vi.mocked(useDoctorProfile).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("No doctor profile found"),
    } as ReturnType<typeof useDoctorProfile>);

    renderWithQuery(<DoctorProfilePage />);
    expect(screen.getByText("No doctor profile found")).toBeTruthy();
  });

  it("should render profile form with fields", () => {
    vi.mocked(useDoctorProfile).mockReturnValue({
      data: mockProfile,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useDoctorProfile>);

    renderWithQuery(<DoctorProfilePage />);

    expect(screen.getByText("Edit Profile")).toBeTruthy();
    expect(screen.getByText("Specialty")).toBeTruthy();
    expect(screen.getByText("Bio")).toBeTruthy();
    expect(screen.getByText("Phone")).toBeTruthy();
    expect(screen.getByText("Profile photo URL")).toBeTruthy();

    // Check read-only specialty field has value
    const specialtyInput = screen.getByDisplayValue("Cardiology");
    expect(specialtyInput).toBeTruthy();
    expect(specialtyInput).toBeDisabled();

    // Check other fields have values
    expect(screen.getByDisplayValue("Experienced cardiologist with 15 years of practice.")).toBeTruthy();
    expect(screen.getByDisplayValue("+1 (555) 123-4567")).toBeTruthy();
    expect(screen.getByDisplayValue("https://example.com/photo.jpg")).toBeTruthy();

    // Check buttons
    expect(screen.getByText("Save Changes")).toBeTruthy();
    expect(screen.getByText("Reset")).toBeTruthy();
  });

  it("should handle null optional fields gracefully", () => {
    vi.mocked(useDoctorProfile).mockReturnValue({
      data: {
        id: 2,
        specialty: "Dermatology",
        bio: "",
        phone: "",
        photo_url: "",
      },
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useDoctorProfile>);

    renderWithQuery(<DoctorProfilePage />);

    const bioField = screen.getByPlaceholderText("Tell patients about yourself...");
    expect(bioField).toBeTruthy();
    expect((bioField as HTMLTextAreaElement).value).toBe("");

    const specialtyInput = screen.getByDisplayValue("Dermatology");
    expect(specialtyInput).toBeTruthy();
    expect(specialtyInput).toBeDisabled();
  });
});
