import { Routes, Route } from "react-router-dom";
import PlayersPage from "./pages/PlayersPage";
import SessionDetailPage from "./pages/SessionDetailPage";
import SessionsPage from "./pages/SessionsPage";
import TemplatesPage from "./pages/TemplatesPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import PlayerProfilePage from "./pages/PlayerProfilePage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import AdminManagementPage from "./pages/AdminManagementPage";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";
import { AuthLayout } from "./components/layout/AuthLayout";

export function AppContent() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      <Route element={<AppLayout />}>
        <Route path="/" element={<SessionsPage />} />
        <Route path="/players" element={<PlayersPage />} />
        <Route path="/players/:id" element={<PlayerProfilePage />} />
        <Route path="/sessions" element={<SessionsPage />} />
        <Route path="/sessions/:id" element={<SessionDetailPage />} />
        <Route
          path="/templates"
          element={
            <ProtectedRoute>
              <TemplatesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <ChangePasswordPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-management"
          element={
            <ProtectedRoute>
              <AdminManagementPage />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}
