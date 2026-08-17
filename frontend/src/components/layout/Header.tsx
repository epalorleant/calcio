import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useTranslation } from "../../i18n/useTranslation";
import { useAuth } from "../../auth/AuthContext";
import { LanguageSwitcher } from "../LanguageSwitcher";
import { AccountMenu } from "./AccountMenu";
import { useIsMobile } from "../../hooks/useMediaQuery";

export function Header() {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const isAdmin = user?.is_admin || user?.is_root;
  const isMobile = useIsMobile();
  const [navOpen, setNavOpen] = useState(false);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? "nav-link nav-link-active" : "nav-link";

  return (
    <header className="topbar">
      <Link to="/sessions" className="brand">
        Calcio
      </Link>

      {isMobile && (
        <button
          type="button"
          className="btn btn-ghost nav-toggle"
          onClick={() => setNavOpen((open) => !open)}
          aria-expanded={navOpen}
          aria-label="Toggle navigation"
        >
          ☰
        </button>
      )}

      <nav className={`nav ${navOpen || !isMobile ? "nav-open" : ""}`}>
        <NavLink to="/players" className={navLinkClass} onClick={() => setNavOpen(false)}>
          {t.players}
        </NavLink>
        <NavLink to="/sessions" className={navLinkClass} onClick={() => setNavOpen(false)}>
          {t.sessions}
        </NavLink>
        {isAdmin && (
          <NavLink to="/templates" className={navLinkClass} onClick={() => setNavOpen(false)}>
            {t.templates}
          </NavLink>
        )}
      </nav>

      <div className="topbar-actions">
        {isAuthenticated ? (
          <AccountMenu />
        ) : (
          <Link to="/login" className="btn btn-ghost btn-sm">
            {t.login}
          </Link>
        )}
        <LanguageSwitcher />
      </div>
    </header>
  );
}
