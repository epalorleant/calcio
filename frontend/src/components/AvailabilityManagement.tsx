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

  const playerOptions = useMemo(
    () => players.filter((p) => !assignedPlayerIds.has(p.id)).map((p) => ({ value: p.id, label: p.name })),
    [players, assignedPlayerIds],
  );

  return (
    <section style={commonStyles.section}>
      <h2 style={commonStyles.subheading}>Manage Availability</h2>
      {error && <p style={commonStyles.error}>{error}</p>}
      <form onSubmit={onSubmit} style={commonStyles.form}>
        <label style={commonStyles.field}>
          <span style={commonStyles.label}>Player</span>
          <select
            style={commonStyles.select}
            multiple
            value={form.player_ids.map(String)}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions).map((opt) => Number(opt.value));
              onFormChange({ ...form, player_ids: selected });
            }}
          >
            <option value="" disabled>
              Select players
            </option>
            {playerOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
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
          Save Availability
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

