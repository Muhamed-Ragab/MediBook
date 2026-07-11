import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AdminUsers from "@/features/admin/pages/AdminUsers";

vi.mock("../../api/adminApi", () => ({
  useUsers: vi.fn(),
  useUpdateUser: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}));

import { useUsers } from "@/features/admin/api/adminApi";
import type { AdminUser } from "@/features/admin/types";

const mockUsers: AdminUser[] = [
  {
    id: 1,
    username: "admin1",
    email: "admin@example.com",
    role: "admin" as const,
    first_name: "Admin",
    last_name: "User",
    is_approved: true,
    is_blocked: false,
    email_verified: true,
  },
  {
    id: 2,
    username: "dr_smith",
    email: "smith@example.com",
    role: "doctor" as const,
    first_name: "John",
    last_name: "Smith",
    is_approved: true,
    is_blocked: false,
    email_verified: true,
  },
  {
    id: 3,
    username: "jane_doe",
    email: "jane@example.com",
    role: "patient" as const,
    first_name: "Jane",
    last_name: "Doe",
    is_approved: false,
    is_blocked: false,
    email_verified: false,
  },
  {
    id: 4,
    username: "blocked_user",
    email: "blocked@example.com",
    role: "patient" as const,
    first_name: "Blocked",
    last_name: "User",
    is_approved: true,
    is_blocked: true,
    email_verified: true,
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

describe("AdminUsers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show loading spinner when data is loading", () => {
    vi.mocked(useUsers).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as ReturnType<typeof useUsers>);

    renderWithQuery(<AdminUsers />);
    expect(document.querySelector(".loading-spinner")).toBeTruthy();
  });

  it("should show error state on fetch failure", () => {
    vi.mocked(useUsers).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("Failed to fetch"),
    } as ReturnType<typeof useUsers>);

    renderWithQuery(<AdminUsers />);
    expect(screen.getByText("Failed to load users")).toBeTruthy();
  });

  it("should show empty state when no users", () => {
    vi.mocked(useUsers).mockReturnValue({
      data: [] as AdminUser[],
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useUsers>);

    renderWithQuery(<AdminUsers />);
    expect(screen.getByText("No users found")).toBeTruthy();
  });

  it("should render user rows in table", () => {
    vi.mocked(useUsers).mockReturnValue({
      data: mockUsers,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useUsers>);

    renderWithQuery(<AdminUsers />);

    expect(screen.getByText("admin1")).toBeTruthy();
    expect(screen.getByText("dr_smith")).toBeTruthy();
    expect(screen.getByText("jane_doe")).toBeTruthy();
    expect(screen.getByText("blocked_user")).toBeTruthy();
  });

  it("should render correct role badges", () => {
    vi.mocked(useUsers).mockReturnValue({
      data: mockUsers,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useUsers>);

    renderWithQuery(<AdminUsers />);

    const adminBadges = screen.getAllByText("admin");
    const doctorBadges = screen.getAllByText("doctor");
    const patientBadges = screen.getAllByText("patient");

    expect(adminBadges).toHaveLength(1);
    expect(doctorBadges).toHaveLength(1);
    expect(patientBadges).toHaveLength(2);
  });

  it("should render correct status badges", () => {
    vi.mocked(useUsers).mockReturnValue({
      data: mockUsers,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useUsers>);

    renderWithQuery(<AdminUsers />);

    const approved = screen.getAllByText("Approved");
    const pending = screen.getAllByText("Pending");
    const blocked = screen.getAllByText("Blocked");

    expect(approved.length).toBeGreaterThanOrEqual(1);
    expect(pending.length).toBeGreaterThanOrEqual(1);
    expect(blocked.length).toBeGreaterThanOrEqual(1);
  });

  it("should show user count in description", () => {
    vi.mocked(useUsers).mockReturnValue({
      data: mockUsers,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useUsers>);

    renderWithQuery(<AdminUsers />);

    expect(screen.getByText("4 users registered")).toBeTruthy();
  });

  it("should show correct action button labels", () => {
    vi.mocked(useUsers).mockReturnValue({
      data: mockUsers,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useUsers>);

    renderWithQuery(<AdminUsers />);

    const buttons = screen.getAllByRole("button");
    const buttonTexts = buttons.map((b) => b.textContent);

    expect(buttonTexts).toContain("Block");
    expect(buttonTexts).toContain("Unblock");
    expect(buttonTexts).toContain("Approve");
  });

  it("should handle singular user count", () => {
    vi.mocked(useUsers).mockReturnValue({
      data: [mockUsers[0]],
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useUsers>);

    renderWithQuery(<AdminUsers />);

    expect(screen.getByText("1 user registered")).toBeTruthy();
  });

  it("should render heading", () => {
    vi.mocked(useUsers).mockReturnValue({
      data: mockUsers,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useUsers>);

    renderWithQuery(<AdminUsers />);

    expect(screen.getByText("Manage Users")).toBeTruthy();
  });
});
