import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "../i18n/useTranslation";
import { useAuth } from "../auth/AuthContext";
import { login, getCurrentUser } from "../api/auth";
import { commonStyles } from "../styles/common";

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login: setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    } catch (err: any) {
      setError(err.response?.data?.detail || t.loginError || "Failed to login");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center", 
      minHeight: "100vh", 
      backgroundColor: "#0f172a",
      padding: "1rem",
    }}>
      <div style={{ 
        width: "100%", 
        maxWidth: "400px", 
        padding: "2rem", 
        backgroundColor: "#1e293b", 
        borderRadius: "8px",
      }}>
        <h1 style={{ ...commonStyles.h1, color: "#e2e8f0", marginBottom: "1.5rem", textAlign: "center" }}>
          {t.login || "Login"}
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
              {t.password || "Password"}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ ...commonStyles.input, width: "100%" }}
              disabled={isLoading}
            />
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
            {isLoading ? (t.loading || "Loading...") : (t.login || "Login")}
          </button>
        </form>

        <div style={{ marginTop: "1.5rem", textAlign: "center", color: "#94a3b8" }}>
          {t.noAccount || "Don't have an account?"}{" "}
          <Link to="/register" style={{ color: "#60a5fa", textDecoration: "none" }}>
            {t.register || "Register"}
          </Link>
        </div>
      </div>
    </div>
  );
}

