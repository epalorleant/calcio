import { Link, Routes, Route } from "react-router-dom";
import PlayersPage from "./pages/PlayersPage";
import SessionDetailPage from "./pages/SessionDetailPage";
import SessionsPage from "./pages/SessionsPage";
import TemplatesPage from "./pages/TemplatesPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import PlayerProfilePage from "./pages/PlayerProfilePage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import AdminManagementPage from "./pages/AdminManagementPage";
import { useTranslation } from "./i18n/useTranslation";
import { useAuth } from "./auth/AuthContext";
import { LanguageSwitcher } from "./components/LanguageSwitcher";
import { ProtectedRoute } from "./auth/ProtectedRoute";

export function AppContent() {
  const { t } = useTranslation();
  const { isAuthenticated, logout, user } = useAuth();
  const isAdmin = user?.is_admin || user?.is_root;
  
  return (
    <div className="layout">
      <header className="topbar">
        <div className="brand">Calcio</div>
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "0.75rem", 
          flex: 1, 
          justifyContent: "flex-end",
          flexWrap: "wrap",
        }}>
            <nav className="nav">
              <Link to="/players" reloadDocument>{t.players}</Link>
              <Link to="/sessions" reloadDocument>{t.sessions}</Link>
              {isAdmin && <Link to="/templates" reloadDocument>{t.templates}</Link>}
            </nav>
          {isAuthenticated ? (
            <>
              <div style={{ color: "#cbd5e1", fontSize: "0.9rem", whiteSpace: "nowrap" }}>
                {user?.username}
              </div>
              {user?.player_id && (
                <Link
                  to={`/players/${user.player_id}`}
                  style={{
                    padding: "0.5rem 0.75rem",
                    backgroundColor: "transparent",
                    color: "#cbd5e1",
                    border: "1px solid #475569",
                    borderRadius: "4px",
                    textDecoration: "none",
                    fontSize: "0.875rem",
                    whiteSpace: "nowrap",
                    minHeight: "36px",
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                >
                  {t.playerProfile}
                </Link>
              )}
              <Link
                to="/change-password"
                style={{
                  padding: "0.5rem 0.75rem",
                  backgroundColor: "transparent",
                  color: "#cbd5e1",
                  border: "1px solid #475569",
                  borderRadius: "4px",
                  textDecoration: "none",
                  fontSize: "0.875rem",
                  whiteSpace: "nowrap",
                  minHeight: "36px",
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                {t.changePassword}
              </Link>
              {user?.is_root && (
                <Link
                  to="/admin-management"
                  style={{
                    padding: "0.5rem 0.75rem",
                    backgroundColor: "transparent",
                    color: "#cbd5e1",
                    border: "1px solid #475569",
                    borderRadius: "4px",
                    textDecoration: "none",
                    fontSize: "0.875rem",
                    whiteSpace: "nowrap",
                    minHeight: "36px",
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                >
                  {t.adminManagement}
                </Link>
              )}
              <button
                onClick={logout}
                style={{
                  padding: "0.5rem 0.75rem",
                  backgroundColor: "transparent",
                  color: "#cbd5e1",
                  border: "1px solid #475569",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  whiteSpace: "nowrap",
                  minHeight: "36px",
                }}
              >
                {t.logout}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Always use window.location for reliable navigation
                // This works even when React Router navigation is blocked
                window.location.href = "/login";
              }}
              style={{
                padding: "0.5rem 0.75rem",
                backgroundColor: "transparent",
                color: "#cbd5e1",
                border: "1px solid #475569",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "0.875rem",
                whiteSpace: "nowrap",
                minHeight: "36px",
              }}
            >
              {t.login}
            </button>
          )}
          <LanguageSwitcher />
        </div>
      </header>

      <main className="content">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
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
        </Routes>
      </main>
    </div>
  );
}

