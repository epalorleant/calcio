import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "../i18n/useTranslation";
import { useAuth } from "../auth/AuthContext";
import { register, getCurrentUser } from "../api/auth";

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login: setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [createPlayer, setCreatePlayer] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t.passwordsDoNotMatch);
      return;
    }
    if (password.length < 8) {
      setError(t.passwordTooShort);
      return;
    }
    if (createPlayer && !playerName.trim()) {
      setError(t.playerNameRequired);
      return;
    }

    setIsLoading(true);
    try {
      await register({
        email,
        username,
        password,
        create_player: createPlayer,
        player_name: createPlayer ? playerName.trim() : undefined,
      });
      const user = await getCurrentUser();
      setUser(user);
      navigate("/");
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detail || t.registerError || "Failed to register");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <h1 className="auth-card-title">{t.register}</h1>

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
          <span className="field-label">{t.username}</span>
          <input
            type="text"
            className="field-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
            minLength={3}
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
              autoComplete="new-password"
              required
              minLength={8}
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

        <label className="field">
          <span className="field-label">{t.confirmPassword}</span>
          <input
            type={showPassword ? "text" : "password"}
            className="field-input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
            minLength={8}
            disabled={isLoading}
          />
        </label>

        <label className="checkbox-row">
          <input
            type="checkbox"
            id="createPlayer"
            checked={createPlayer}
            onChange={(e) => {
              setCreatePlayer(e.target.checked);
              if (!e.target.checked) setPlayerName("");
            }}
            disabled={isLoading}
          />
          <span>{t.createPlayerAccount}</span>
        </label>

        {createPlayer && (
          <label className="field">
            <span className="field-label">{t.playerName}</span>
            <input
              type="text"
              className="field-input"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              autoComplete="name"
              required
              disabled={isLoading}
            />
          </label>
        )}

        {error && <div className="text-error" style={{ padding: "0.5rem", background: "#7f1d1d", borderRadius: "4px", color: "#fca5a5" }}>{error}</div>}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? t.loading : t.register}
          </button>
        </div>
      </form>

      <div className="auth-footer">
        {t.alreadyHaveAccount}{" "}
        <Link to="/login">{t.login}</Link>
      </div>
    </div>
  );
}
