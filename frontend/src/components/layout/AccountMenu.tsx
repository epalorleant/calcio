import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "../../i18n/useTranslation";
import { useAuth } from "../../auth/AuthContext";

export function AccountMenu() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div className="account-menu" ref={menuRef}>
      <button
        type="button"
        className="btn btn-ghost account-menu-trigger"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        {user?.username}
      </button>
      {open && (
        <div className="account-menu-dropdown">
          {user?.player_id && (
            <Link to={`/players/${user.player_id}`} className="account-menu-item" onClick={() => setOpen(false)}>
              {t.playerProfile}
            </Link>
          )}
          <Link to="/change-password" className="account-menu-item" onClick={() => setOpen(false)}>
            {t.changePassword}
          </Link>
          {user?.is_root && (
            <Link to="/admin-management" className="account-menu-item" onClick={() => setOpen(false)}>
              {t.adminManagement}
            </Link>
          )}
          <button type="button" className="account-menu-item account-menu-logout" onClick={logout}>
            {t.logout}
          </button>
        </div>
      )}
    </div>
  );
}
