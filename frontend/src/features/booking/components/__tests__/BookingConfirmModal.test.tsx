import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BookingConfirmModal from "@/features/booking/components/BookingConfirmModal";
import type { AvailableSlot } from "@/features/booking/types";

const sampleSlot: AvailableSlot = {
  id: 1,
  start_time: "2026-07-20T09:00:00Z",
  end_time: "2026-07-20T09:30:00Z",
  is_booked: false,
  doctor: 1,
};

describe("BookingConfirmModal", () => {
  it("should not render when isOpen is false", () => {
    render(
      <BookingConfirmModal
        slot={sampleSlot}
        doctorName="Dr. Smith"
        isOpen={false}
        isPending={false}
        onConfirm={() => {}}
        onClose={() => {}}
      />,
    );

    expect(screen.queryByRole("dialog", { hidden: true })).toBeNull();
  });

  it("should render slot details when open", () => {
    render(
      <BookingConfirmModal
        slot={sampleSlot}
        doctorName="Dr. Smith"
        isOpen={true}
        isPending={false}
        onConfirm={() => {}}
        onClose={() => {}}
      />,
    );

    expect(
      screen.getByRole("dialog", { hidden: true }),
    ).toBeInTheDocument();
    expect(screen.getByText("Dr. Smith")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Confirm Booking", hidden: true }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Cancel", hidden: true }),
    ).toBeInTheDocument();
    expect(screen.getByText("Date")).toBeInTheDocument();
    expect(screen.getByText("Time")).toBeInTheDocument();
  });

  it("should call onConfirm when Confirm is clicked", async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();

    render(
      <BookingConfirmModal
        slot={sampleSlot}
        doctorName="Dr. Smith"
        isOpen={true}
        isPending={false}
        onConfirm={onConfirm}
        onClose={() => {}}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Confirm Booking", hidden: true }),
    );
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("should call onClose when Cancel is clicked", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(
      <BookingConfirmModal
        slot={sampleSlot}
        doctorName="Dr. Smith"
        isOpen={true}
        isPending={false}
        onConfirm={() => {}}
        onClose={onClose}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Cancel", hidden: true }),
    );
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("should disable buttons when isPending is true", () => {
    render(
      <BookingConfirmModal
        slot={sampleSlot}
        doctorName="Dr. Smith"
        isOpen={true}
        isPending={true}
        onConfirm={() => {}}
        onClose={() => {}}
      />,
    );

    const cancelBtn = screen.getByRole("button", {
      name: "Cancel",
      hidden: true,
    });
    expect(cancelBtn).toBeDisabled();

    const confirmBtn = screen.getAllByRole("button", { hidden: true })[1];
    expect(confirmBtn).toBeDisabled();
  });

  it("should show spinner when isPending is true", () => {
    render(
      <BookingConfirmModal
        slot={sampleSlot}
        doctorName="Dr. Smith"
        isOpen={true}
        isPending={true}
        onConfirm={() => {}}
        onClose={() => {}}
      />,
    );

    const confirmBtn = screen.getAllByRole("button", { hidden: true })[1];
    expect(confirmBtn.querySelector(".loading")).toBeInTheDocument();
  });
});
