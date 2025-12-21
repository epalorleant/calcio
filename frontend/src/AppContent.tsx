import { Link, Routes, Route } from "react-router-dom";
import PlayersPage from "./pages/PlayersPage";
import SessionDetailPage from "./pages/SessionDetailPage";
import SessionsPage from "./pages/SessionsPage";
import TemplatesPage from "./pages/TemplatesPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import { useTranslation } from "./i18n/useTranslation";
import { useAuth } from "./auth/AuthContext";
import { LanguageSwitcher } from "./components/LanguageSwitcher";

export function AppContent() {
  const { t } = useTranslation();
  const { isAuthenticated, logout, user } = useAuth();
  
  return (
    <div className="layout">
      {isAuthenticated && (
        <header className="topbar">
          <div className="brand">Calcio</div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1, justifyContent: "flex-end" }}>
            <nav className="nav">
              <Link to="/players" reloadDocument>{t.players}</Link>
              <Link to="/sessions" reloadDocument>{t.sessions}</Link>
              <Link to="/templates" reloadDocument>{t.templates}</Link>
            </nav>
            <div style={{ color: "#cbd5e1", fontSize: "0.9rem" }}>
              {user?.username}
            </div>
            <button
              onClick={logout}
              style={{
                padding: "0.4rem 0.8rem",
                backgroundColor: "transparent",
                color: "#cbd5e1",
                border: "1px solid #475569",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "0.9rem",
              }}
            >
              {t.logout}
            </button>
            <LanguageSwitcher />
          </div>
        </header>
      )}

      <main className="content">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<SessionsPage />} />
          <Route path="/players" element={<PlayersPage />} />
          <Route path="/sessions" element={<SessionsPage />} />
          <Route path="/sessions/:id" element={<SessionDetailPage />} />
          <Route path="/templates" element={<TemplatesPage />} />
        </Routes>
      </main>
    </div>
  );
}

