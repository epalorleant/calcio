import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "../i18n/useTranslation";
import { useAuth } from "../auth/AuthContext";
import { login, getCurrentUser } from "../api/auth";

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login: setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login({ email, password });
      const user = await getCurrentUser();
      setUser(user);
      navigate("/");
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detail || t.loginError || "Failed to login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <h1 className="auth-card-title">{t.login}</h1>

      <form onSubmit={handleSubmit} className="auth-form">
        <label className="field">
          <span className="field-label">{t.email}</span>
          <input
            type="email"
            className="field-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            disabled={isLoading}
          />
        </label>

        <label className="field">
          <span className="field-label">{t.password}</span>
          <div className="password-field">
            <input
              type={showPassword ? "text" : "password"}
              className="field-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              disabled={isLoading}
            />
            <button
              type="button"
              className="btn btn-ghost password-toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? t.hidePassword : t.showPassword}
            >
              {showPassword ? t.hidePassword : t.showPassword}
            </button>
          </div>
        </label>

        {error && <div className="text-error" style={{ padding: "0.5rem", background: "#7f1d1d", borderRadius: "4px", color: "#fca5a5" }}>{error}</div>}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? t.loading : t.login}
          </button>
        </div>
      </form>

      <div className="auth-footer">
        {t.noAccount}{" "}
        <Link to="/register">{t.register}</Link>
      </div>
    </div>
  );
}
