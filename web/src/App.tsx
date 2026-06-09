import { lazy, Suspense, type ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import MainLayout from "./layout/MainLayout";
import CalendarPage from "./pages/CalendarPage";
import MeetSignupSheet from "./pages/MeetSignupSheet";
import MeetCheckinPage from "./pages/MeetCheckinPage";
import MeetSelfCheckinPage from "./pages/MeetSelfCheckinPage";
import AttendeeStatusPage from "./pages/AttendeeStatusPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import SplashPage from "./pages/SplashPage";
import PrivacyPage from "./pages/PrivacyPage";
import TncPage from "./pages/TncPage";
import RequestAccountDeletionPage from "./pages/RequestAccountDeletionPage";
import { RequireAuth } from "./components/auth/RequireAuth";
import { FullPageSpinner } from "./components/FullPageSpinner";

const ListPage = lazy(() => import("./pages/ListPage"));
const OrganisationsPage = lazy(() => import("./pages/OrganisationsPage"));
const MembersPage = lazy(() => import("./pages/MembersPage"));
const TemplatesPage = lazy(() => import("./pages/TemplatesPage"));

function withPageLoader(element: ReactNode) {
  return <Suspense fallback={<FullPageSpinner />}>{element}</Suspense>;
}

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route element={<RequireAuth />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/plan" element={withPageLoader(<ListPage />)} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route
            path="/admin/organizations"
            element={withPageLoader(<OrganisationsPage />)}
          />
          <Route
            path="/admin/organizations/:id/members"
            element={withPageLoader(<MembersPage />)}
          />
          <Route path="/admin/users" element={withPageLoader(<MembersPage />)} />
          <Route
            path="/admin/organizations/:id/templates"
            element={withPageLoader(<TemplatesPage />)}
          />
        </Route>
      </Route>
      <Route path="/meet/:id/checkin" element={<MeetCheckinPage />} />
      <Route path="/meets/:code/checkin" element={<MeetSelfCheckinPage />} />
      <Route path="/meets/:code/:attendeeId" element={<AttendeeStatusPage />} />
      <Route path="/meets/:code" element={<MeetSignupSheet />} />
      <Route path="/share/:code" element={<MeetSignupSheet />} />
      <Route path="/splash" element={<SplashPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/privacy-policy" element={<Navigate to="/privacy" replace />} />
      <Route
        path="/request-account-deletion"
        element={<RequestAccountDeletionPage />}
      />
      <Route path="/tnc" element={<TncPage />} />
      <Route
        path="/terms-and-conditions"
        element={<Navigate to="/tnc" replace />}
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/oauth/callback/google" element={<LoginPage />} />
      <Route path="/oauth/callback/facebook" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
