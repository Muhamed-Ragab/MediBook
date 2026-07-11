import { describe, it, expect } from "vitest";
import { useUiStore } from "@/shared/stores/uiStore";

describe("uiStore", () => {
  it("should start with sidebar closed", () => {
    const state = useUiStore.getState();
    expect(state.sidebarOpen).toBe(false);
  });

  it("should toggle sidebar", () => {
    const { toggleSidebar } = useUiStore.getState();
    toggleSidebar();
    expect(useUiStore.getState().sidebarOpen).toBe(true);
    toggleSidebar();
    expect(useUiStore.getState().sidebarOpen).toBe(false);
  });

  it("should set sidebar open state", () => {
    const { setSidebarOpen } = useUiStore.getState();
    setSidebarOpen(true);
    expect(useUiStore.getState().sidebarOpen).toBe(true);
    setSidebarOpen(false);
    expect(useUiStore.getState().sidebarOpen).toBe(false);
  });
});
