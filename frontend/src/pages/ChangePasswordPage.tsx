import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { changePassword } from "../api/auth";
import { useAuth } from "../auth/AuthContext";
import { useTranslation } from "../i18n/useTranslation";
import { commonStyles } from "../styles/common";

export default function ChangePasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [form, setForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isAuthenticated) {
    return (
      <div style={commonStyles.container}>
        <p style={commonStyles.error}>{t.accessDenied}</p>
        <button style={commonStyles.button} onClick={() => navigate("/login")}>
          {t.login}
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (form.new_password.length < 8) {
      setError(t.passwordTooShort);
      return;
    }

    if (form.new_password !== form.confirm_password) {
      setError(t.passwordsDoNotMatch);
      return;
    }

    try {
      setLoading(true);
      await changePassword({
        current_password: form.current_password,
        new_password: form.new_password,
      });
      setSuccess(t.passwordChanged);
      setForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.detail) {
        setError(String(err.response.data.detail));
      } else {
        setError(t.failedToChangePassword);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={commonStyles.container}>
      <div style={{ marginBottom: "1.5rem" }}>
        <button
          style={{ ...commonStyles.button, marginBottom: "1rem" }}
          onClick={() => navigate(-1)}
        >
          {t.back}
        </button>
        <h1 style={commonStyles.heading}>{t.changePassword}</h1>
      </div>

      <div style={commonStyles.card}>
        <form onSubmit={handleSubmit} style={commonStyles.form}>
          {error && <p style={commonStyles.error}>{error}</p>}
          {success && <p style={{ ...commonStyles.success, color: "#10b981" }}>{success}</p>}

          <div style={commonStyles.field}>
            <label style={commonStyles.label}>{t.currentPassword}</label>
            <input
              type="password"
              style={commonStyles.input}
              value={form.current_password}
              onChange={(e) => setForm({ ...form, current_password: e.target.value })}
              required
            />
          </div>

          <div style={commonStyles.field}>
            <label style={commonStyles.label}>{t.newPassword}</label>
            <input
              type="password"
              style={commonStyles.input}
              value={form.new_password}
              onChange={(e) => setForm({ ...form, new_password: e.target.value })}
              required
              minLength={8}
            />
          </div>

          <div style={commonStyles.field}>
            <label style={commonStyles.label}>{t.confirmPassword}</label>
            <input
              type="password"
              style={commonStyles.input}
              value={form.confirm_password}
              onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
              required
              minLength={8}
            />
          </div>

          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
            <button
              type="submit"
              style={commonStyles.button}
              disabled={loading}
            >
              {loading ? t.saving : t.changePassword}
            </button>
            <button
              type="button"
              style={{ ...commonStyles.button, backgroundColor: "#475569" }}
              onClick={() => navigate(-1)}
            >
              {t.cancel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

