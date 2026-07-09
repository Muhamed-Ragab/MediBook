import { Outlet } from "react-router";

export function Component() {
  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center">
      <Outlet />
    </div>
  );
}
