import { Outlet } from "react-router";

export function Component() {
  return (
    <div className="min-h-screen bg-base-200 flex">
      <aside className="w-64 bg-base-100 min-h-screen p-4 shadow-sm">
        <nav className="flex flex-col gap-2">
          {/* TODO: sidebar nav items */}
        </nav>
      </aside>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
