import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import MainLayout from "./layout/MainLayout";
import ListPage from "./pages/ListPage";
import CalendarPage from "./pages/CalendarPage";
import MeetSignupSheet from "./pages/MeetSignupSheet";
import MeetCheckinPage from "./pages/MeetCheckinPage";
import AttendeeStatusPage from "./pages/AttendeeStatusPage";
import OrganisationsPage from "./pages/OrganisationsPage";
import MembersPage from "./pages/MembersPage";
import UsersPage from "./pages/UsersPage";
import TemplatesPage from "./pages/TemplatesPage";

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/plan" element={<ListPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/admin/organizations" element={<OrganisationsPage />} />
        <Route
          path="/admin/organizations/:id/members"
          element={<MembersPage />}
        />
        <Route path="/admin/users" element={<UsersPage />} />
        <Route
          path="/admin/organizations/:id/templates"
          element={<TemplatesPage />}
        />
      </Route>
      <Route path="/meet/:id/checkin" element={<MeetCheckinPage />} />
      <Route path="/meets/:code/:attendeeId" element={<AttendeeStatusPage />} />
      <Route path="/meets/:code" element={<MeetSignupSheet />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
