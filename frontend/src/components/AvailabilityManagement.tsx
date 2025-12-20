import { memo, useMemo } from "react";
import type { FormEvent } from "react";
import type { Player } from "../api/players";
import type { Availability, SessionPlayer } from "../api/sessions";
import { commonStyles } from "../styles/common";

interface AvailabilityManagementProps {
  players: Player[];
  availability: SessionPlayer[];
  form: {
    player_ids: number[];
    availability: Availability;
    is_goalkeeper: boolean;
  };
  onFormChange: (form: { player_ids: number[]; availability: Availability; is_goalkeeper: boolean }) => void;
  onSubmit: (e: FormEvent) => Promise<void>;
  error: string | null;
}

export const AvailabilityManagement = memo(function AvailabilityManagement({
  players,
  availability,
  form,
  onFormChange,
  onSubmit,
  error,
}: AvailabilityManagementProps) {
  const assignedPlayerIds = useMemo(() => new Set(availability.map((entry) => entry.player_id)), [availability]);

  // Include all players, but mark assigned ones differently
  const playerOptions = useMemo(
    () =>
      players.map((p) => ({
        value: p.id,
        label: assignedPlayerIds.has(p.id) ? `${p.name} (already assigned)` : p.name,
        isAssigned: assignedPlayerIds.has(p.id),
      })),
    [players, assignedPlayerIds],
  );

  const handleEdit = (entry: SessionPlayer) => {
    onFormChange({
      player_ids: [entry.player_id],
      availability: entry.availability,
      is_goalkeeper: entry.is_goalkeeper,
    });
    // Scroll to form
    document.querySelector('form')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const isEditing = form.player_ids.length === 1 && assignedPlayerIds.has(form.player_ids[0]);
  const editingPlayerName = isEditing
    ? players.find((p) => p.id === form.player_ids[0])?.name || "Unknown"
    : null;

  return (
    <section style={commonStyles.section}>
      <h2 style={commonStyles.subheading}>Manage Availability</h2>
      {isEditing && editingPlayerName && (
        <p style={{ ...commonStyles.muted, marginBottom: "0.5rem", fontStyle: "italic" }}>
          Editing availability for: <strong>{editingPlayerName}</strong>
        </p>
      )}
      {error && <p style={commonStyles.error}>{error}</p>}
      <form onSubmit={onSubmit} style={commonStyles.form}>
        <label style={{ ...commonStyles.field, gridColumn: "1 / -1" }}>
          <span style={commonStyles.label}>Player</span>
          <select
            style={{
              ...commonStyles.select,
              minHeight: "120px",
              width: "100%",
              padding: "0.5rem",
            }}
            multiple
            size={Math.min(playerOptions.length + 1, 6)}
            value={form.player_ids.map(String)}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions).map((opt) => Number(opt.value));
              onFormChange({ ...form, player_ids: selected });
            }}
          >
            {playerOptions.length === 0 ? (
              <option value="" disabled>
                All players have been assigned
              </option>
            ) : (
              playerOptions.map((opt) => (
                <option key={opt.value} value={opt.value} style={opt.isAssigned ? { fontStyle: "italic" } : undefined}>
                  {opt.label}
                </option>
              ))
            )}
          </select>
          {form.player_ids.length > 0 && (
            <p style={{ ...commonStyles.muted, marginTop: "0.25rem", fontSize: "0.85rem" }}>
              {form.player_ids.length} player{form.player_ids.length !== 1 ? "s" : ""} selected
            </p>
          )}
        </label>

        <label style={commonStyles.field}>
          <span style={commonStyles.label}>Availability</span>
          <select
            style={commonStyles.select}
            value={form.availability}
            onChange={(e) => onFormChange({ ...form, availability: e.target.value as Availability })}
          >
            <option value="YES">Yes</option>
            <option value="NO">No</option>
            <option value="MAYBE">Maybe</option>
          </select>
        </label>

        <label style={commonStyles.checkboxRow}>
          <input
            type="checkbox"
            checked={form.is_goalkeeper}
            onChange={(e) => onFormChange({ ...form, is_goalkeeper: e.target.checked })}
          />
          <span style={commonStyles.checkboxLabel}>Goalkeeper</span>
        </label>

        <button style={commonStyles.button} type="submit">
          {isEditing ? "Update Availability" : "Save Availability"}
        </button>
      </form>

      <div>
        <h3 style={commonStyles.smallHeading}>Current Availability</h3>
        {availability.length === 0 && <p>No entries yet.</p>}
        {availability.length > 0 && (
          <table style={commonStyles.table}>
            <thead>
              <tr>
                <th style={commonStyles.th}>Player</th>
                <th style={commonStyles.th}>Availability</th>
                <th style={commonStyles.th}>Team</th>
                <th style={commonStyles.th}>GK</th>
                <th style={commonStyles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {availability.map((entry) => {
                const playerName = players.find((p) => p.id === entry.player_id)?.name || entry.player_id;
                return (
                  <tr key={entry.id}>
                    <td style={commonStyles.td}>{playerName}</td>
                    <td style={commonStyles.td}>{entry.availability}</td>
                    <td style={commonStyles.td}>{entry.team ?? "—"}</td>
                    <td style={commonStyles.td}>{entry.is_goalkeeper ? "Yes" : "No"}</td>
                    <td style={commonStyles.td}>
                      <button
                        type="button"
                        onClick={() => handleEdit(entry)}
                        style={{
                          ...commonStyles.button,
                          backgroundColor: "#6b7280",
                          padding: "0.35rem 0.6rem",
                          fontSize: "0.85rem",
                        }}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
});

