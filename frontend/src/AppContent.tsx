import { Link, Routes, Route } from "react-router-dom";
import PlayersPage from "./pages/PlayersPage";
import SessionDetailPage from "./pages/SessionDetailPage";
import SessionsPage from "./pages/SessionsPage";
import TemplatesPage from "./pages/TemplatesPage";
import { useTranslation } from "./i18n/useTranslation";
import { LanguageSwitcher } from "./components/LanguageSwitcher";

export function AppContent() {
  const { t } = useTranslation();
  
  return (
    <div className="layout">
      <header className="topbar">
        <div className="brand">Calcio</div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1, justifyContent: "flex-end" }}>
          <nav className="nav">
            <Link to="/players" reloadDocument>{t.players}</Link>
            <Link to="/sessions" reloadDocument>{t.sessions}</Link>
            <Link to="/templates" reloadDocument>{t.templates}</Link>
          </nav>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="content">
        <Routes>
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

