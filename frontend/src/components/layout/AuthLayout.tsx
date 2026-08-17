import { Outlet } from "react-router-dom";
import { LanguageSwitcher } from "../LanguageSwitcher";

export function AuthLayout() {
  return (
    <div className="auth-layout">
      <div className="auth-layout-toolbar">
        <LanguageSwitcher />
      </div>
      <Outlet />
    </div>
  );
}
