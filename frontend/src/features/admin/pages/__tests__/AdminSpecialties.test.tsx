import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AdminSpecialties from "@/features/admin/pages/AdminSpecialties";

vi.mock("../../api/adminApi", () => ({
  useSpecialties: vi.fn(),
  useCreateSpecialty: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
  useUpdateSpecialty: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
  useDeleteSpecialty: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}));

import { useSpecialties } from "@/features/admin/api/adminApi";
import type { Specialty } from "@/features/admin/types";

const mockSpecialties: Specialty[] = [
  {
    id: 1,
    name: "Cardiology",
    description: "Heart and cardiovascular system",
  },
  {
    id: 2,
    name: "Dermatology",
    description: "Skin, hair, and nails",
  },
  {
    id: 3,
    name: "Neurology",
    description: "Brain and nervous system",
  },
  {
    id: 4,
    name: "Pediatrics",
    description: "",
  },
];

function Wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

function renderWithQuery(ui: React.ReactElement) {
  return render(<Wrapper>{ui}</Wrapper>);
}

describe("AdminSpecialties", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show loading spinner when data is loading", () => {
    vi.mocked(useSpecialties).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as ReturnType<typeof useSpecialties>);

    renderWithQuery(<AdminSpecialties />);
    expect(document.querySelector(".loading-spinner")).toBeTruthy();
  });

  it("should show error state on fetch failure", () => {
    vi.mocked(useSpecialties).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("Failed to fetch"),
    } as ReturnType<typeof useSpecialties>);

    renderWithQuery(<AdminSpecialties />);
    expect(screen.getByText("Failed to load specialties")).toBeTruthy();
  });

  it("should show empty state when no specialties", () => {
    vi.mocked(useSpecialties).mockReturnValue({
      data: [] as Specialty[],
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useSpecialties>);

    renderWithQuery(<AdminSpecialties />);
    expect(screen.getByText("No specialties found")).toBeTruthy();
  });

  it("should render specialty rows in table", () => {
    vi.mocked(useSpecialties).mockReturnValue({
      data: mockSpecialties,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useSpecialties>);

    renderWithQuery(<AdminSpecialties />);

    expect(screen.getByText("Cardiology")).toBeTruthy();
    expect(screen.getByText("Dermatology")).toBeTruthy();
    expect(screen.getByText("Neurology")).toBeTruthy();
    expect(screen.getByText("Pediatrics")).toBeTruthy();
  });

  it("should render descriptions", () => {
    vi.mocked(useSpecialties).mockReturnValue({
      data: mockSpecialties,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useSpecialties>);

    renderWithQuery(<AdminSpecialties />);

    expect(screen.getByText("Heart and cardiovascular system")).toBeTruthy();
    expect(screen.getByText("Skin, hair, and nails")).toBeTruthy();
  });

  it("should show italic placeholder for empty description", () => {
    vi.mocked(useSpecialties).mockReturnValue({
      data: mockSpecialties,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useSpecialties>);

    renderWithQuery(<AdminSpecialties />);

    expect(screen.getByText("No description")).toBeTruthy();
  });

  it("should render heading and Add Specialty button", () => {
    vi.mocked(useSpecialties).mockReturnValue({
      data: mockSpecialties,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useSpecialties>);

    renderWithQuery(<AdminSpecialties />);

    expect(screen.getByText("Manage Specialties")).toBeTruthy();
    const addLabels = screen.getAllByText("Add Specialty");
    expect(addLabels.length).toBeGreaterThanOrEqual(1);
  });

  it("should show specialty count in description", () => {
    vi.mocked(useSpecialties).mockReturnValue({
      data: [mockSpecialties[0]],
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useSpecialties>);

    renderWithQuery(<AdminSpecialties />);

    expect(screen.getByText("1 specialty configured")).toBeTruthy();
  });

  it("should show specialties count for multiple", () => {
    vi.mocked(useSpecialties).mockReturnValue({
      data: mockSpecialties,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useSpecialties>);

    renderWithQuery(<AdminSpecialties />);

    expect(screen.getByText("4 specialties configured")).toBeTruthy();
  });

  it("should render Edit and Delete buttons for each row", () => {
    vi.mocked(useSpecialties).mockReturnValue({
      data: mockSpecialties,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useSpecialties>);

    renderWithQuery(<AdminSpecialties />);

    const editButtons = screen.getAllByText("Edit");
    const deleteButtons = screen.getAllByText("Delete");

    expect(editButtons).toHaveLength(4);
    // +1 from Delete confirmation modal button
    expect(deleteButtons).toHaveLength(5);
  });

  it("should handle empty description as undefined", () => {
    vi.mocked(useSpecialties).mockReturnValue({
      data: [mockSpecialties[3]],
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useSpecialties>);

    renderWithQuery(<AdminSpecialties />);

    expect(screen.getByText("No description")).toBeTruthy();
  });
});
