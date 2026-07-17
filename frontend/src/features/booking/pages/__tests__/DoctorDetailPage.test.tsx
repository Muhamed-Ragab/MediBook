import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import DoctorDetailPage from "@/features/booking/pages/DoctorDetailPage";

const mockDoctor = {
  id: 1,
  name: "Smith",
  specialty: "Cardiology",
  bio: "Experienced cardiologist",
  phone: "555-0100",
  photo_url: "",
  next_available: null,
};

function createWrapper(doctorId = "1") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return {
    queryClient,
    wrapper: function Wrapper({ children }: { children: React.ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          <MemoryRouter initialEntries={[`/patient/doctors/${doctorId}`]}>
            <Routes>
              <Route
                path="/patient/doctors/:doctorId"
                element={children}
              />
            </Routes>
          </MemoryRouter>
        </QueryClientProvider>
      );
    },
  };
}

describe("DoctorDetailPage", () => {
  it("should show loading state while fetching doctor", () => {
    const { wrapper } = createWrapper();
    render(<DoctorDetailPage />, { wrapper });
    expect(document.querySelector(".loading")).toBeInTheDocument();
  });

  it("should render back button", () => {
    const { queryClient, wrapper } = createWrapper();
    queryClient.setQueryData(["doctors", undefined, undefined], [mockDoctor]);
    render(<DoctorDetailPage />, { wrapper });
    expect(
      screen.getByRole("button", { name: "← Back to search" }),
    ).toBeInTheDocument();
  });

  it("should render week navigation", () => {
    const { queryClient, wrapper } = createWrapper();
    queryClient.setQueryData(["doctors", undefined, undefined], [mockDoctor]);
    render(<DoctorDetailPage />, { wrapper });
    expect(
      screen.getByRole("button", { name: "← Previous" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Next →" }),
    ).toBeInTheDocument();
  });

  it("should render time grid header", () => {
    const { queryClient, wrapper } = createWrapper();
    queryClient.setQueryData(["doctors", undefined, undefined], [mockDoctor]);
    render(<DoctorDetailPage />, { wrapper });
    expect(screen.getByText("Mon")).toBeInTheDocument();
    expect(screen.getByText("Tue")).toBeInTheDocument();
    expect(screen.getByText("Wed")).toBeInTheDocument();
    expect(screen.getByText("Thu")).toBeInTheDocument();
    expect(screen.getByText("Fri")).toBeInTheDocument();
    expect(screen.getByText("Sat")).toBeInTheDocument();
    expect(screen.getByText("Sun")).toBeInTheDocument();
  });
});
