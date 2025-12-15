import { useEffect, useMemo, useState } from "react";
import type { FormEvent, CSSProperties } from "react";
import { isAxiosError } from "axios";
import { Link, useParams } from "react-router-dom";
import { getPlayers, type Player } from "../api/players";
import {
  generateBalancedTeams,
  getAvailability,
  getSession,
  setAvailability,
  type Availability,
  type BalancedTeamsResponse,
  type Session,
  type SessionPlayer,
} from "../api/sessions";
import {
  createMatch,
  getMatchForSession,
  sessionTeamToMatchTeam,
  type MatchTeam,
  type PlayerStatInput,
  type SessionMatch,
} from "../api/matches";

type Option = { value: number; label: string };

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const sessionId = Number(id);

  const [session, setSession] = useState<Session | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [availability, setAvailabilityList] = useState<SessionPlayer[]>([]);
  const [balanced, setBalanced] = useState<BalancedTeamsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchForm, setMatchForm] = useState({
    scoreTeamA: 0,
    scoreTeamB: 0,
    notes: "",
  });
  const [playerStats, setPlayerStats] = useState<
    Record<number, { goals: number; assists: number; minutes_played: number }>
  >({});
  const [existingMatch, setExistingMatch] = useState<SessionMatch | null>(null);
  const [benchTeams, setBenchTeams] = useState<Record<number, MatchTeam | "">>({});
  const [matchError, setMatchError] = useState<string | null>(null);
  const [matchSuccess, setMatchSuccess] = useState<string | null>(null);
  const [savingMatch, setSavingMatch] = useState(false);

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
    setExistingMatch(null);
    setMatchForm({ scoreTeamA: 0, scoreTeamB: 0, notes: "" });
    setPlayerStats({});
    setBenchTeams({});
    setMatchError(null);
    setMatchSuccess(null);
    try {
      setLoading(true);
      setError(null);
      const [sessionData, playersData, availabilityRes] = await Promise.all([
        getSession(sessionId),
        getPlayers(),
        fetchAvailability(sessionId),
      ]);
      setSession(sessionData);
      setPlayers(playersData);
      setAvailabilityList(availabilityRes);
      await loadMatch(sessionId);
    } catch (err) {
      console.error(err);
      setError("Failed to load session details.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailability = async (sid: number) => {
    return getAvailability(sid);
  };

  const loadMatch = async (sid: number) => {
    setExistingMatch(null);
    setMatchSuccess(null);
    try {
      const matchData = await getMatchForSession(sid);
      if (matchData) {
        setExistingMatch(matchData);
        setMatchForm({
          scoreTeamA: matchData.score_team_a,
          scoreTeamB: matchData.score_team_b,
          notes: matchData.notes ?? "",
        });
        const statsMap: Record<number, { goals: number; assists: number; minutes_played: number }> = {};
        matchData.stats.forEach((stat) => {
          statsMap[stat.player_id] = {
            goals: stat.goals,
            assists: stat.assists,
            minutes_played: stat.minutes_played,
          };
        });
        setPlayerStats((prev) => ({ ...prev, ...statsMap }));
        const benchSelection: Record<number, MatchTeam | ""> = {};
        matchData.bench_players.forEach((sp) => {
          const stat = matchData.stats.find((s) => s.player_id === sp.player_id);
          benchSelection[sp.player_id] = stat?.team ?? "";
        });
        setBenchTeams((prev) => ({ ...prev, ...benchSelection }));
      } else {
        setMatchForm({ scoreTeamA: 0, scoreTeamB: 0, notes: "" });
      }
    } catch (err) {
      console.error(err);
      setMatchError("Failed to load match data.");
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const teamAPlayers = availability.filter((entry) => entry.team === "A");
  const teamBPlayers = availability.filter((entry) => entry.team === "B");
  const benchPlayers = availability.filter((entry) => entry.team !== "A" && entry.team !== "B");

  useEffect(() => {
    const relevant = [...teamAPlayers, ...teamBPlayers, ...benchPlayers];
    if (relevant.length === 0) return;
    setPlayerStats((prev) => {
      const next = { ...prev };
      relevant.forEach((entry) => {
        if (!next[entry.player_id]) {
          next[entry.player_id] = { goals: 0, assists: 0, minutes_played: 0 };
        }
      });
      return next;
    });
  }, [teamAPlayers, teamBPlayers, benchPlayers]);

  useEffect(() => {
    if (benchPlayers.length === 0) return;
    setBenchTeams((prev) => {
      const next = { ...prev };
      benchPlayers.forEach((entry) => {
        if (!next[entry.player_id]) {
          next[entry.player_id] = "";
        }
      });
      return next;
    });
  }, [benchPlayers]);

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

  const handleStatChange = (
    playerId: number,
    field: "goals" | "assists" | "minutes_played",
    value: number,
  ) => {
    setPlayerStats((prev) => ({
      ...prev,
      [playerId]: {
        ...(prev[playerId] ?? { goals: 0, assists: 0, minutes_played: 0 }),
        [field]: Number.isNaN(value) ? 0 : value,
      },
    }));
  };

  const handleSaveMatch = async () => {
    if (!sessionId) return;
    const participants = [...teamAPlayers, ...teamBPlayers, ...benchPlayers];
    if (participants.length === 0) {
      setMatchError("Add players to the session before saving a result.");
      return;
    }
    if (existingMatch) {
      setMatchError("A match result already exists for this session.");
      return;
    }
    const missingBenchTeams = benchPlayers.filter((entry) => !benchTeams[entry.player_id]);
    if (missingBenchTeams.length > 0) {
      setMatchError("Select which team each bench player appeared for.");
      return;
    }
    setMatchError(null);
    setMatchSuccess(null);
    setSavingMatch(true);
    try {
      const payload = {
        session_id: sessionId,
        score_team_a: matchForm.scoreTeamA,
        score_team_b: matchForm.scoreTeamB,
        notes: matchForm.notes || undefined,
        player_stats: participants
          .map((entry) => {
            const resolvedTeam =
              entry.team === "A" || entry.team === "B"
                ? sessionTeamToMatchTeam(entry.team)
                : benchTeams[entry.player_id] ?? null;
            if (!resolvedTeam) return null;
            const line = playerStats[entry.player_id];
            return {
              player_id: entry.player_id,
              team: resolvedTeam,
              goals: line?.goals ?? 0,
              assists: line?.assists ?? 0,
              minutes_played: line?.minutes_played ?? 0,
            } satisfies PlayerStatInput;
          })
          .filter((stat): stat is PlayerStatInput => Boolean(stat)),
      };

      const savedMatch = await createMatch(payload);
      setExistingMatch(savedMatch);
      setMatchSuccess("Match result saved.");
    } catch (err) {
      console.error(err);
      if (isAxiosError(err) && err.response?.data?.detail) {
        setMatchError(String(err.response.data.detail));
      } else {
        setMatchError("Failed to save match result.");
      }
    } finally {
      setSavingMatch(false);
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
      <Link to="/sessions" style={styles.linkButton}>
        ← Back to sessions
      </Link>
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

      <section style={styles.section}>
        <h2 style={styles.subheading}>Match result</h2>
        {matchError && <p style={styles.error}>{matchError}</p>}
        {matchSuccess && <p style={styles.success}>{matchSuccess}</p>}
        {existingMatch && (
          <p style={styles.muted}>
            A match result already exists for this session. Editing existing results is not yet
            supported.
          </p>
        )}
        <div style={styles.scoreRow}>
          <label style={styles.field}>
            <span style={styles.label}>Score Team A</span>
            <input
              type="number"
              min={0}
              style={styles.input}
              value={matchForm.scoreTeamA}
              onChange={(e) =>
                setMatchForm((f) => ({ ...f, scoreTeamA: Number(e.target.value) || 0 }))
              }
            />
          </label>
          <label style={styles.field}>
            <span style={styles.label}>Score Team B</span>
            <input
              type="number"
              min={0}
              style={styles.input}
              value={matchForm.scoreTeamB}
              onChange={(e) =>
                setMatchForm((f) => ({ ...f, scoreTeamB: Number(e.target.value) || 0 }))
              }
            />
          </label>
          <label style={{ ...styles.field, flex: 1 }}>
            <span style={styles.label}>Notes</span>
            <textarea
              style={styles.textarea}
              rows={2}
              value={matchForm.notes}
              onChange={(e) => setMatchForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </label>
        </div>

        <div style={styles.teamsGrid}>
          <MatchStatsTable
            title="Team A"
            players={teamAPlayers}
            playerLookup={players}
            playerStats={playerStats}
            onStatChange={handleStatChange}
          />
          <MatchStatsTable
            title="Team B"
            players={teamBPlayers}
            playerLookup={players}
            playerStats={playerStats}
            onStatChange={handleStatChange}
          />
        </div>

        <BenchStatsTable
          players={benchPlayers}
          playerLookup={players}
          playerStats={playerStats}
          benchTeams={benchTeams}
          onTeamChange={(playerId, team) =>
            setBenchTeams((prev) => ({ ...prev, [playerId]: team }))
          }
          onStatChange={handleStatChange}
        />

        <button
          style={{ ...styles.button, marginTop: "0.75rem" }}
          onClick={() => void handleSaveMatch()}
          disabled={savingMatch || !!existingMatch}
        >
          {savingMatch ? "Saving..." : "Save result"}
        </button>
      </section>
    </div>
  );
}

function MatchStatsTable({
  title,
  players,
  playerLookup,
  playerStats,
  onStatChange,
}: {
  title: string;
  players: SessionPlayer[];
  playerLookup: Player[];
  playerStats: Record<number, { goals: number; assists: number; minutes_played: number }>;
  onStatChange: (
    playerId: number,
    field: "goals" | "assists" | "minutes_played",
    value: number,
  ) => void;
}) {
  return (
    <div style={styles.card}>
      <h3 style={styles.smallHeading}>{title}</h3>
      {players.length === 0 && <p style={styles.muted}>Assign players to this team to record stats.</p>}
      {players.length > 0 && (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Player</th>
              <th style={styles.th}>Goals</th>
              <th style={styles.th}>Assists</th>
              <th style={styles.th}>Minutes</th>
            </tr>
          </thead>
          <tbody>
            {players.map((entry) => {
              const playerName =
                playerLookup.find((p) => p.id === entry.player_id)?.name || entry.player_id;
              const stats = playerStats[entry.player_id] ?? { goals: 0, assists: 0, minutes_played: 0 };
              return (
                <tr key={entry.player_id}>
                  <td style={styles.td}>{playerName}</td>
                  <td style={styles.td}>
                    <input
                      type="number"
                      min={0}
                      style={styles.input}
                      value={stats.goals}
                      onChange={(e) => onStatChange(entry.player_id, "goals", Number(e.target.value))}
                    />
                  </td>
                  <td style={styles.td}>
                    <input
                      type="number"
                      min={0}
                      style={styles.input}
                      value={stats.assists}
                      onChange={(e) =>
                        onStatChange(entry.player_id, "assists", Number(e.target.value))
                      }
                    />
                  </td>
                  <td style={styles.td}>
                    <input
                      type="number"
                      min={0}
                      style={styles.input}
                      value={stats.minutes_played}
                      onChange={(e) =>
                        onStatChange(entry.player_id, "minutes_played", Number(e.target.value))
                      }
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

function BenchStatsTable({
  players,
  playerLookup,
  playerStats,
  benchTeams,
  onTeamChange,
  onStatChange,
}: {
  players: SessionPlayer[];
  playerLookup: Player[];
  playerStats: Record<number, { goals: number; assists: number; minutes_played: number }>;
  benchTeams: Record<number, MatchTeam | "">;
  onTeamChange: (playerId: number, team: MatchTeam | "") => void;
  onStatChange: (
    playerId: number,
    field: "goals" | "assists" | "minutes_played",
    value: number,
  ) => void;
}) {
  return (
    <div style={styles.card}>
      <h3 style={styles.smallHeading}>Bench</h3>
      {players.length === 0 && <p style={styles.muted}>No bench players assigned.</p>}
      {players.length > 0 && (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Player</th>
              <th style={styles.th}>Played for</th>
              <th style={styles.th}>Goals</th>
              <th style={styles.th}>Assists</th>
              <th style={styles.th}>Minutes</th>
            </tr>
          </thead>
          <tbody>
            {players.map((entry) => {
              const playerName =
                playerLookup.find((p) => p.id === entry.player_id)?.name || entry.player_id;
              const stats = playerStats[entry.player_id] ?? { goals: 0, assists: 0, minutes_played: 0 };
              const selectedTeam = benchTeams[entry.player_id] ?? "";
              return (
                <tr key={entry.player_id}>
                  <td style={styles.td}>{playerName}</td>
                  <td style={styles.td}>
                    <select
                      style={styles.select}
                      value={selectedTeam}
                      onChange={(e) => onTeamChange(entry.player_id, e.target.value as MatchTeam | "")}
                    >
                      <option value="">Select team</option>
                      <option value="A">Team A</option>
                      <option value="B">Team B</option>
                    </select>
                  </td>
                  <td style={styles.td}>
                    <input
                      type="number"
                      min={0}
                      style={styles.input}
                      value={stats.goals}
                      onChange={(e) => onStatChange(entry.player_id, "goals", Number(e.target.value))}
                    />
                  </td>
                  <td style={styles.td}>
                    <input
                      type="number"
                      min={0}
                      style={styles.input}
                      value={stats.assists}
                      onChange={(e) => onStatChange(entry.player_id, "assists", Number(e.target.value))}
                    />
                  </td>
                  <td style={styles.td}>
                    <input
                      type="number"
                      min={0}
                      style={styles.input}
                      value={stats.minutes_played}
                      onChange={(e) =>
                        onStatChange(entry.player_id, "minutes_played", Number(e.target.value))
                      }
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
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
  input: {
    width: "100%",
    padding: "0.45rem 0.5rem",
    border: "1px solid #d1d5db",
    borderRadius: "4px",
  },
  textarea: {
    width: "100%",
    padding: "0.45rem 0.5rem",
    border: "1px solid #d1d5db",
    borderRadius: "4px",
    resize: "vertical",
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
  success: {
    color: "#065f46",
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
    textDecoration: "none",
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
  scoreRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "0.75rem",
    marginBottom: "0.75rem",
    alignItems: "end",
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
