import { lazy } from "react";
import { createBrowserRouter } from "react-router";

const HomePage = lazy(() => import("../features/home/pages/HomePage"));
const LoginPage = lazy(() => import("../features/auth/pages/LoginPage"));
const RegisterPage = lazy(() => import("../features/auth/pages/RegisterPage"));
const DoctorDashboard = lazy(() => import("../features/dashboard/pages/DoctorDashboard"));
const PatientDashboard = lazy(() => import("../features/dashboard/pages/PatientDashboard"));
const AdminDashboard = lazy(() => import("../features/admin/pages/AdminDashboard"));
const AppointmentsPage = lazy(() => import("../features/dashboard/pages/AppointmentsPage"));
const AvailabilityPage = lazy(() => import("../features/availability/pages/AvailabilityPage"));
const DoctorSearchPage = lazy(() => import("../features/booking/pages/DoctorSearchPage"));
const BookAppointmentPage = lazy(() => import("../features/booking/pages/BookAppointmentPage"));
const DoctorProfilePage = lazy(() => import("../features/profile/pages/DoctorProfilePage"));
const PatientProfilePage = lazy(() => import("../features/profile/pages/PatientProfilePage"));

export const router = createBrowserRouter([
  {
    path: "/",
    lazy: () => import("../shared/layouts/RootLayout"),
    children: [
      { index: true, Component: HomePage },
      {
        lazy: () => import("../shared/layouts/AuthLayout"),
        children: [
          { path: "login", Component: LoginPage },
          { path: "register", Component: RegisterPage },
        ],
      },
      {
        path: "doctor",
        lazy: () => import("../shared/layouts/DashboardLayout"),
        children: [
          { index: true, Component: DoctorDashboard },
          { path: "availability", Component: AvailabilityPage },
          { path: "appointments", Component: AppointmentsPage },
          { path: "profile", Component: DoctorProfilePage },
        ],
      },
      {
        path: "patient",
        lazy: () => import("../shared/layouts/DashboardLayout"),
        children: [
          { index: true, Component: PatientDashboard },
          { path: "search", Component: DoctorSearchPage },
          { path: "book/:doctorId", Component: BookAppointmentPage },
          { path: "appointments", Component: AppointmentsPage },
          { path: "profile", Component: PatientProfilePage },
        ],
      },
      {
        path: "admin",
        lazy: () => import("../shared/layouts/DashboardLayout"),
        children: [
          { index: true, Component: AdminDashboard },
        ],
      },
    ],
  },
]);
