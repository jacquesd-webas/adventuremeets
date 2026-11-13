import { lazy, Suspense, type ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAuth } from "./components/auth/RequireAuth";
import { FullPageSpinner } from "./components/FullPageSpinner";

const ListPage = lazy(() => import("./pages/ListPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const MainLayout = lazy(() => import("./layout/MainLayout"));
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const MeetSignupSheet = lazy(() => import("./pages/MeetSignupSheet"));
const MeetCheckinRoute = lazy(() => import("./pages/MeetCheckinRoute"));
const MeetSelfCheckinRoute = lazy(() => import("./pages/MeetSelfCheckinRoute"));
const AttendeeStatusPage = lazy(() => import("./pages/AttendeeStatusPage"));
const ConfirmIndemnityPage = lazy(() => import("./pages/ConfirmIndemnityPage"));
const MeetAttendeesPage = lazy(() => import("./pages/MeetAttendeesPage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const SplashPage = lazy(() => import("./pages/SplashPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const TncPage = lazy(() => import("./pages/TncPage"));
const RequestAccountDeletionPage = lazy(
  () => import("./pages/RequestAccountDeletionPage"),
);
const OrganisationsPage = lazy(() => import("./pages/OrganisationsPage"));
const MembersPage = lazy(() => import("./pages/MembersPage"));
const TemplatesPage = lazy(() => import("./pages/TemplatesPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));

function withPageLoader(element: ReactNode) {
  return <Suspense fallback={<FullPageSpinner />}>{element}</Suspense>;
}

function App() {
  return (
    <Routes>
      <Route element={withPageLoader(<MainLayout />)}>
        <Route element={<RequireAuth />}>
          <Route path="/" element={withPageLoader(<DashboardPage />)} />
          <Route path="/plan" element={withPageLoader(<ListPage />)} />
          <Route path="/calendar" element={withPageLoader(<CalendarPage />)} />
          <Route
            path="/meet/:id/attendees"
            element={withPageLoader(<MeetAttendeesPage />)}
          />
          <Route
            path="/admin/organizations"
            element={withPageLoader(<OrganisationsPage />)}
          />
          <Route
            path="/admin/organizations/:id/members"
            element={withPageLoader(<MembersPage />)}
          />
          <Route
            path="/admin/users"
            element={withPageLoader(<MembersPage />)}
          />
          <Route
            path="/admin/reports"
            element={withPageLoader(<ReportsPage />)}
          />
          <Route
            path="/admin/reports/:type"
            element={withPageLoader(<ReportsPage />)}
          />
          <Route
            path="/admin/organizations/:id/templates"
            element={withPageLoader(<TemplatesPage />)}
          />
        </Route>
      </Route>
      <Route
        path="/meet/:id/checkin"
        element={withPageLoader(<MeetCheckinRoute />)}
      />
      <Route
        path="/meets/:code/checkin"
        element={withPageLoader(<MeetSelfCheckinRoute />)}
      />
      <Route
        path="/meets/:code/:attendeeId/confirm-indemnity"
        element={withPageLoader(<ConfirmIndemnityPage />)}
      />
      <Route
        path="/meets/:code/:attendeeId"
        element={withPageLoader(<AttendeeStatusPage />)}
      />
      <Route
        path="/meets/:code"
        element={withPageLoader(<MeetSignupSheet />)}
      />
      <Route
        path="/share/:code"
        element={withPageLoader(<MeetSignupSheet />)}
      />
      <Route path="/splash" element={withPageLoader(<SplashPage />)} />
      <Route path="/privacy" element={withPageLoader(<PrivacyPage />)} />
      <Route
        path="/privacy-policy"
        element={<Navigate to="/privacy" replace />}
      />
      <Route
        path="/request-account-deletion"
        element={withPageLoader(<RequestAccountDeletionPage />)}
      />
      <Route path="/tnc" element={withPageLoader(<TncPage />)} />
      <Route
        path="/terms-and-conditions"
        element={<Navigate to="/tnc" replace />}
      />
      <Route path="/login" element={withPageLoader(<LoginPage />)} />
      <Route
        path="/oauth/callback/google"
        element={withPageLoader(<LoginPage />)}
      />
      <Route
        path="/oauth/callback/facebook"
        element={withPageLoader(<LoginPage />)}
      />
      <Route
        path="/forgot-password"
        element={withPageLoader(<ForgotPasswordPage />)}
      />
      <Route
        path="/reset-password"
        element={withPageLoader(<ResetPasswordPage />)}
      />
      <Route path="/register" element={withPageLoader(<RegisterPage />)} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
