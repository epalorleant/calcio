import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { createSession, deleteSession, getSessions, type Session, type SessionCreate } from "../api/sessions";
import { useTranslation } from "../i18n/useTranslation";
import { useDateFormat } from "../hooks/useDateFormat";
import { useAuth } from "../auth/AuthContext";
import { ResponsiveTable } from "../components/ui/ResponsiveTable";
import { useConfirmDialog } from "../components/ui/ConfirmDialog";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { PageHeader } from "../components/layout/PageHeader";

const defaultDateValue = () => new Date().toISOString().slice(0, 16);

export default function SessionsPage() {
  const { t } = useTranslation();
  const { formatDate } = useDateFormat();
  const { isAuthenticated, user } = useAuth();
  const isAdmin = user?.is_admin || user?.is_root;
  const navigate = useNavigate();
  const { confirm } = useConfirmDialog();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<SessionCreate>({
    date: defaultDateValue(),
    location: "",
    max_players: 10,
  });

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSessions();
      if (!Array.isArray(data)) {
        setError(t.unexpectedResponse);
        setSessions([]);
        return;
      }
      setSessions(data);
    } catch (err) {
      console.error(err);
      setError(t.failedToLoadSessions);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSessions();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.location.trim() || !form.date) {
      setError(t.dateAndLocationRequired);
      return;
    }
    try {
      setError(null);
      await createSession({ ...form, location: form.location.trim() });
      setForm({ date: defaultDateValue(), location: "", max_players: 10 });
      await loadSessions();
    } catch (err) {
      console.error(err);
      setError(t.failedToCreateSession);
    }
  };

  const handleDelete = async (sessionId: number) => {
    const confirmed = await confirm({
      message: t.deleteSessionConfirm,
      variant: "danger",
      confirmLabel: t.delete,
    });
    if (!confirmed) return;
    try {
      setError(null);
      await deleteSession(sessionId);
      await loadSessions();
    } catch (err) {
      console.error(err);
      setError(t.failedToDeleteSession);
    }
  };

  const statusLabel = (status: Session["status"]) =>
    status === "PLANNED" ? t.planned : status === "COMPLETED" ? t.completed : t.cancelled;

  return (
    <div className="page-container">
      <PageHeader title={t.sessionsPage} />

      {isAdmin && (
        <form onSubmit={handleSubmit} className="form-grid">
          <label className="field">
            <span className="field-label">{t.dateTime}</span>
            <input
              className="field-input"
              type="datetime-local"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              required
            />
          </label>
          <label className="field">
            <span className="field-label">{t.location}</span>
            <input
              className="field-input"
              type="text"
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              placeholder="ex. Salle communautaire"
              required
            />
          </label>
          <label className="field">
            <span className="field-label">{t.maxPlayers}</span>
            <input
              className="field-input"
              type="number"
              min={2}
              max={30}
              value={form.max_players}
              onChange={(e) => setForm((f) => ({ ...f, max_players: Number(e.target.value) }))}
              required
            />
          </label>
          <button className="btn btn-primary" type="submit">
            {t.createSession}
          </button>
        </form>
      )}

      {!isAuthenticated && <p className="text-muted" style={{ fontStyle: "italic", marginBottom: "1rem" }}>{t.readOnlyMode}</p>}

      {loading && <LoadingSpinner label={t.loadingSessions} />}
      {error && <p className="text-error">{error}</p>}
      {!loading && sessions.length === 0 && <p>{t.noSessions}</p>}

      {!loading && sessions.length > 0 && (
        <ResponsiveTable
          data={sessions}
          getRowKey={(session) => session.id}
          columns={[
            { key: "date", header: t.date, render: (session) => formatDate(session.date) },
            { key: "location", header: t.location, render: (session) => session.location },
            { key: "status", header: t.status, render: (session) => statusLabel(session.status) },
          ]}
          actions={(session) => (
            <>
              <button className="btn-action" onClick={() => navigate(`/sessions/${session.id}`)}>
                {t.viewDetails}
              </button>
              {isAuthenticated && (
                <button className="btn-action btn-action-danger" onClick={() => void handleDelete(session.id)}>
                  {t.delete}
                </button>
              )}
            </>
          )}
        />
      )}
    </div>
  );
}
