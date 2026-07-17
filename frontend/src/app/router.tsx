import { lazy } from "react";
import { createBrowserRouter } from "react-router";

const HomePage = lazy(() => import("../features/home/pages/HomePage"));
const LoginPage = lazy(() => import("../features/auth/pages/LoginPage"));
const RegisterPage = lazy(() => import("../features/auth/pages/RegisterPage"));
const DoctorDashboard = lazy(() => import("../features/dashboard/pages/DoctorDashboard"));
const PatientDashboard = lazy(() => import("../features/dashboard/pages/PatientDashboard"));
const AdminDashboard = lazy(() => import("../features/admin/pages/AdminDashboard"));
const AdminUsers = lazy(() => import("../features/admin/pages/AdminUsers"));
const AdminSpecialties = lazy(() => import("../features/admin/pages/AdminSpecialties"));
const AdminAppointments = lazy(() => import("../features/admin/pages/AdminAppointments"));
const AppointmentsPage = lazy(() => import("../features/dashboard/pages/AppointmentsPage"));
const AvailabilityPage = lazy(() => import("../features/availability/pages/AvailabilityPage"));
const DoctorSearchPage = lazy(() => import("../features/booking/pages/DoctorSearchPage"));
const DoctorDetailPage = lazy(() => import("../features/booking/pages/DoctorDetailPage"));
const DoctorProfilePage = lazy(() => import("../features/profile/pages/DoctorProfilePage"));
const PatientProfilePage = lazy(() => import("../features/profile/pages/PatientProfilePage"));
const VerifyEmailPage = lazy(() => import("../features/auth/pages/VerifyEmailPage"));

export const router = createBrowserRouter([
  {
    path: "/",
    lazy: () => import("../shared/layouts/RootLayout"),
    children: [
      { index: true, Component: HomePage },
      { path: "verify-email", Component: VerifyEmailPage },
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
          { path: "doctors/:doctorId", Component: DoctorDetailPage },
          { path: "appointments", Component: AppointmentsPage },
          { path: "profile", Component: PatientProfilePage },
        ],
      },
      {
        path: "admin",
        lazy: () => import("../shared/layouts/DashboardLayout"),
        children: [
          { index: true, Component: AdminDashboard },
          { path: "users", Component: AdminUsers },
          { path: "specialties", Component: AdminSpecialties },
          { path: "appointments", Component: AdminAppointments },
        ],
      },
    ],
  },
]);
