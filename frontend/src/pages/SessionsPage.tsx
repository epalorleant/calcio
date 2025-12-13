import { useEffect, useState } from "react";
import type { FormEvent, CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { createSession, getSessions, type Session, type SessionCreate } from "../api/sessions";

const defaultDateValue = () => new Date().toISOString().slice(0, 16); // yyyy-MM-ddTHH:mm

export default function SessionsPage() {
  const navigate = useNavigate();
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
        console.error("Unexpected sessions payload", data);
        setError("Unexpected response from server.");
        setSessions([]);
        return;
      }
      setSessions(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load sessions.");
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
      setError("Date and location are required.");
      return;
    }
    try {
      setError(null);
      await createSession({
        ...form,
        location: form.location.trim(),
      });
      setForm({ date: defaultDateValue(), location: "", max_players: 10 });
      await loadSessions();
    } catch (err) {
      console.error(err);
      setError("Failed to create session.");
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Sessions</h1>

      <form onSubmit={handleSubmit} style={styles.form}>
        <label style={styles.field}>
          <span style={styles.label}>Date & time</span>
          <input
            style={styles.input}
            type="datetime-local"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            required
          />
        </label>
        <label style={styles.field}>
          <span style={styles.label}>Location</span>
          <input
            style={styles.input}
            type="text"
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            placeholder="e.g. Community Gym"
            required
          />
        </label>
        <label style={styles.field}>
          <span style={styles.label}>Max players</span>
          <input
            style={styles.input}
            type="number"
            min={2}
            max={30}
            value={form.max_players}
            onChange={(e) => setForm((f) => ({ ...f, max_players: Number(e.target.value) }))}
            required
          />
        </label>
        <button style={styles.button} type="submit">
          Create Session
        </button>
      </form>

      {loading && <p>Loading sessions...</p>}
      {error && <p style={styles.error}>{error}</p>}
      {!loading && sessions.length === 0 && <p>No sessions yet.</p>}

      {sessions.length > 0 && (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Location</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr key={session.id}>
                <td style={styles.td}>{new Date(session.date).toLocaleString()}</td>
                <td style={styles.td}>{session.location}</td>
                <td style={styles.td}>{session.status}</td>
                <td style={styles.td}>
                  <button
                    style={styles.linkButton}
                    onClick={() => navigate(`/sessions/${session.id}`)}
                  >
                    View details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  container: {
    maxWidth: "960px",
    margin: "0 auto",
    padding: "1.5rem",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  heading: {
    marginBottom: "1rem",
  },
  form: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "0.75rem",
    alignItems: "end",
    marginBottom: "1.25rem",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "0.35rem",
  },
  label: {
    fontSize: "0.95rem",
    color: "#374151",
  },
  input: {
    padding: "0.5rem",
    border: "1px solid #d1d5db",
    borderRadius: "4px",
  },
  button: {
    padding: "0.6rem 1rem",
    backgroundColor: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    justifySelf: "start",
  },
  error: {
    color: "#b91c1c",
    marginBottom: "0.75rem",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    textAlign: "left",
    borderBottom: "1px solid #e5e7eb",
    padding: "0.5rem 0.25rem",
  },
  td: {
    padding: "0.5rem 0.25rem",
    borderBottom: "1px solid #f3f4f6",
  },
  linkButton: {
    background: "none",
    border: "none",
    color: "#2563eb",
    cursor: "pointer",
    padding: 0,
  },
};
