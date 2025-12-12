import { useEffect, useState } from "react";
import type { FormEvent, CSSProperties } from "react";
import { createPlayer, getPlayers, updatePlayer, type Player, type PlayerCreate } from "../api/players";

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<PlayerCreate>({
    name: "",
    preferred_position: "",
    active: true,
  });

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPlayers();
      setPlayers(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load players.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchPlayers();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    try {
      setError(null);
      await createPlayer({
        name: form.name.trim(),
        preferred_position: form.preferred_position?.trim() || undefined,
        active: form.active ?? true,
      });
      setForm({ name: "", preferred_position: "", active: true });
      await fetchPlayers();
    } catch (err) {
      console.error(err);
      setError("Failed to create player.");
    }
  };

  const toggleActive = async (player: Player) => {
    try {
      setError(null);
      await updatePlayer(player.id, {
        name: player.name,
        preferred_position: player.preferred_position,
        active: !player.active,
      });
      await fetchPlayers();
    } catch (err) {
      console.error(err);
      setError("Failed to update player.");
    }
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.heading}>Players</h1>

      <form onSubmit={handleSubmit} style={styles.form}>
        <input
            style={styles.input}
            type="text"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
        />
        <input
            style={styles.input}
            type="text"
            placeholder="Preferred position"
            value={form.preferred_position ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, preferred_position: e.target.value }))}
        />
        <label style={styles.checkboxRow}>
          <input
              type="checkbox"
              checked={form.active ?? true}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
          />
          <span style={styles.checkboxLabel}>Active</span>
        </label>
        <button style={styles.button} type="submit">Add Player</button>
      </form>

      {loading && <p>Loading players...</p>}
      {error && <p style={styles.error}>{error}</p>}

      {!loading && players.length === 0 && <p>No players yet.</p>}

      {players.length > 0 && (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Name</th>
              <th style={styles.th}>Preferred Position</th>
              <th style={styles.th}>Active</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player) => (
              <tr key={player.id}>
                <td style={styles.td}>{player.name}</td>
                <td style={styles.td}>{player.preferred_position || "—"}</td>
                <td style={styles.td}>{player.active ? "Yes" : "No"}</td>
                <td style={styles.td}>
                  <button style={styles.linkButton} onClick={() => void toggleActive(player)}>
                    Set {player.active ? "Inactive" : "Active"}
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
    gridTemplateColumns: "1fr 1fr auto auto",
    gap: "0.5rem",
    alignItems: "center",
    marginBottom: "1rem",
  },
  input: {
    padding: "0.5rem",
    border: "1px solid #ccc",
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
  },
  error: {
    color: "#b91c1c",
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
