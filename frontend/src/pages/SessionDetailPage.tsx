import { useEffect, useMemo, useState } from "react";
import type { FormEvent, CSSProperties } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getPlayers, type Player } from "../api/players";
import {
  generateBalancedTeams,
  getSession,
  setAvailability,
  type Availability,
  type BalancedTeamsResponse,
  type Session,
  type SessionPlayer,
} from "../api/sessions";

type Option = { value: number; label: string };

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const sessionId = Number(id);

  const [session, setSession] = useState<Session | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [availability, setAvailabilityList] = useState<SessionPlayer[]>([]);
  const [balanced, setBalanced] = useState<BalancedTeamsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<{
    player_id: number | "";
    availability: Availability;
    is_goalkeeper: boolean;
  }>({
    player_id: "",
    availability: "YES",
    is_goalkeeper: false,
  });

  const playerOptions: Option[] = useMemo(
    () => players.map((p) => ({ value: p.id, label: p.name })),
    [players],
  );

  const loadData = async () => {
    if (!sessionId) {
      setError("Invalid session id.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const [sessionData, playersData] = await Promise.all([getSession(sessionId), getPlayers()]);
      setSession(sessionData);
      setPlayers(playersData);
      const availabilityRes = await fetchAvailability(sessionId);
      setAvailabilityList(availabilityRes);
    } catch (err) {
      console.error(err);
      setError("Failed to load session details.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailability = async (sid: number) => {
    // Using the same endpoint as the create set, but fetch via sessions detail to keep simple.
    const res = await fetch(`http://localhost:8000/sessions/${sid}/availability`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      throw new Error("Failed to fetch availability");
    }
    return (await res.json()) as SessionPlayer[];
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!sessionId || form.player_id === "") {
      setError("Select a player.");
      return;
    }
    try {
      setError(null);
      await setAvailability(sessionId, {
        player_id: Number(form.player_id),
        availability: form.availability,
        is_goalkeeper: form.is_goalkeeper,
      });
      setForm({ player_id: "", availability: "YES", is_goalkeeper: false });
      const availabilityRes = await fetchAvailability(sessionId);
      setAvailabilityList(availabilityRes);
    } catch (err) {
      console.error(err);
      setError("Failed to set availability.");
    }
  };

  const handleGenerate = async () => {
    if (!sessionId) return;
    try {
      setError(null);
      setLoading(true);
      const data = await generateBalancedTeams(sessionId);
      setBalanced(data);
      const availabilityRes = await fetchAvailability(sessionId);
      setAvailabilityList(availabilityRes);
    } catch (err) {
      console.error(err);
      setError("Failed to generate balanced teams.");
    } finally {
      setLoading(false);
    }
  };

  if (!sessionId) {
    return <p>Invalid session.</p>;
  }

  return (
    <div style={styles.container}>
      <button style={styles.linkButton} onClick={() => navigate("/sessions")}>
        ← Back to sessions
      </button>
      <h1 style={styles.heading}>Session Details</h1>
      {loading && <p>Loading...</p>}
      {error && <p style={styles.error}>{error}</p>}
      {session && (
        <div style={styles.card}>
          <p><strong>Date:</strong> {new Date(session.date).toLocaleString()}</p>
          <p><strong>Location:</strong> {session.location}</p>
          <p><strong>Status:</strong> {session.status}</p>
        </div>
      )}

      <section style={styles.section}>
        <h2 style={styles.subheading}>Manage Availability</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.field}>
            <span style={styles.label}>Player</span>
            <select
              style={styles.select}
              value={form.player_id}
              onChange={(e) => setForm((f) => ({ ...f, player_id: Number(e.target.value) || "" }))}
            >
              <option value="">Select a player</option>
              {playerOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label style={styles.field}>
            <span style={styles.label}>Availability</span>
            <select
              style={styles.select}
              value={form.availability}
              onChange={(e) => setForm((f) => ({ ...f, availability: e.target.value as Availability }))}
            >
              <option value="YES">Yes</option>
              <option value="NO">No</option>
              <option value="MAYBE">Maybe</option>
            </select>
          </label>

          <label style={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={form.is_goalkeeper}
              onChange={(e) => setForm((f) => ({ ...f, is_goalkeeper: e.target.checked }))}
            />
            <span style={styles.checkboxLabel}>Goalkeeper</span>
          </label>

          <button style={styles.button} type="submit">
            Save Availability
          </button>
        </form>

        <div>
          <h3 style={styles.smallHeading}>Current Availability</h3>
          {availability.length === 0 && <p>No entries yet.</p>}
          {availability.length > 0 && (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Player</th>
                  <th style={styles.th}>Availability</th>
                  <th style={styles.th}>Team</th>
                  <th style={styles.th}>GK</th>
                </tr>
              </thead>
              <tbody>
                {availability.map((entry) => {
                  const playerName = players.find((p) => p.id === entry.player_id)?.name || entry.player_id;
                  return (
                    <tr key={entry.id}>
                      <td style={styles.td}>{playerName}</td>
                      <td style={styles.td}>{entry.availability}</td>
                      <td style={styles.td}>{entry.team ?? "—"}</td>
                      <td style={styles.td}>{entry.is_goalkeeper ? "Yes" : "No"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.subheading}>Balanced Teams</h2>
          <button style={styles.button} onClick={() => void handleGenerate()}>
            Generate balanced teams
          </button>
        </div>
        {balanced ? (
          <div style={styles.teamsGrid}>
            <TeamCard title="Team A" players={balanced.team_a} />
            <TeamCard title="Team B" players={balanced.team_b} />
            <TeamCard title="Bench" players={balanced.bench} />
          </div>
        ) : (
          <p>No teams generated yet.</p>
        )}
        {balanced && <p>Balance score: {balanced.balance_score.toFixed(2)}</p>}
      </section>
    </div>
  );
}

function TeamCard({ title, players }: { title: string; players: BalancedTeamsResponse["team_a"] }) {
  return (
    <div style={styles.card}>
      <h3 style={styles.smallHeading}>{title}</h3>
      {players.length === 0 && <p>None</p>}
      {players.length > 0 && (
        <ul style={styles.list}>
          {players.map((p) => (
            <li key={p.player_id} style={styles.listItem}>
              <span>{p.name}</span>
              <span style={styles.muted}>({p.rating.toFixed(1)}){p.is_goalkeeper ? " GK" : ""}</span>
            </li>
          ))}
        </ul>
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
  subheading: {
    marginBottom: "0.75rem",
  },
  smallHeading: {
    marginBottom: "0.5rem",
  },
  card: {
    border: "1px solid #e5e7eb",
    borderRadius: "8px",
    padding: "0.75rem 1rem",
    background: "#fff",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    marginBottom: "0.75rem",
  },
  section: {
    marginTop: "1.25rem",
  },
  form: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "0.75rem",
    alignItems: "end",
    marginBottom: "1rem",
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
  select: {
    padding: "0.5rem",
    border: "1px solid #d1d5db",
    borderRadius: "4px",
  },
  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: "0.35rem",
  },
  checkboxLabel: {
    fontSize: "0.95rem",
  },
  button: {
    padding: "0.55rem 0.9rem",
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
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "0.5rem",
  },
  teamsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "0.75rem",
  },
  list: {
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  listItem: {
    display: "flex",
    justifyContent: "space-between",
    padding: "0.35rem 0",
    borderBottom: "1px solid #f3f4f6",
  },
  muted: {
    color: "#6b7280",
    fontSize: "0.9rem",
  },
};
