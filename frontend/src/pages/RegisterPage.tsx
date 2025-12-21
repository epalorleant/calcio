import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "../i18n/useTranslation";
import { useAuth } from "../auth/AuthContext";
import { register, getCurrentUser } from "../api/auth";
import { commonStyles } from "../styles/common";

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login: setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [createPlayer, setCreatePlayer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t.passwordsDoNotMatch || "Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError(t.passwordTooShort || "Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      await register({ email, username, password, create_player: createPlayer });
      const user = await getCurrentUser();
      setUser(user);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.detail || t.registerError || "Failed to register");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "#0f172a" }}>
      <div style={{ width: "100%", maxWidth: "400px", padding: "2rem", backgroundColor: "#1e293b", borderRadius: "8px" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "600", color: "#e2e8f0", marginBottom: "1.5rem", textAlign: "center" }}>
          {t.register || "Register"}
        </h1>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <label style={{ ...commonStyles.label, color: "#cbd5e1" }}>
              {t.email || "Email"}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ ...commonStyles.input, width: "100%" }}
              disabled={isLoading}
            />
          </div>

          <div>
            <label style={{ ...commonStyles.label, color: "#cbd5e1" }}>
              {t.username || "Username"}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              style={{ ...commonStyles.input, width: "100%" }}
              disabled={isLoading}
            />
          </div>

          <div>
            <label style={{ ...commonStyles.label, color: "#cbd5e1" }}>
              {t.password || "Password"}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              style={{ ...commonStyles.input, width: "100%" }}
              disabled={isLoading}
            />
          </div>

          <div>
            <label style={{ ...commonStyles.label, color: "#cbd5e1" }}>
              {t.confirmPassword || "Confirm Password"}
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              style={{ ...commonStyles.input, width: "100%" }}
              disabled={isLoading}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input
              type="checkbox"
              id="createPlayer"
              checked={createPlayer}
              onChange={(e) => setCreatePlayer(e.target.checked)}
              disabled={isLoading}
              style={{ cursor: "pointer" }}
            />
            <label htmlFor="createPlayer" style={{ color: "#cbd5e1", cursor: "pointer" }}>
              {t.createPlayerAccount || "Create a player profile with my username"}
            </label>
          </div>

          {error && (
            <div style={{ color: "#ef4444", fontSize: "0.875rem", padding: "0.5rem", backgroundColor: "#7f1d1d", borderRadius: "4px" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              ...commonStyles.button,
              width: "100%",
              backgroundColor: isLoading ? "#475569" : "#2563eb",
              cursor: isLoading ? "not-allowed" : "pointer",
            }}
          >
            {isLoading ? (t.loading || "Loading...") : (t.register || "Register")}
          </button>
        </form>

        <div style={{ marginTop: "1.5rem", textAlign: "center", color: "#94a3b8" }}>
          {t.alreadyHaveAccount || "Already have an account?"}{" "}
          <Link to="/login" style={{ color: "#60a5fa", textDecoration: "none" }}>
            {t.login || "Login"}
          </Link>
        </div>
      </div>
    </div>
  );
}

