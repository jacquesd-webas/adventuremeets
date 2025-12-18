import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import MainLayout from "./layout/MainLayout";
import PlanPage from "./pages/PlanPage";
import ReportsPage from "./pages/ReportsPage";
import MeetSignupSheet from "./pages/MeetSignupSheet";

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/plan" element={<PlanPage />} />
        <Route path="/reports" element={<ReportsPage />} />
      </Route>
      <Route path="/meets/:code" element={<MeetSignupSheet />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
