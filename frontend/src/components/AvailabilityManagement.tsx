import { memo, useMemo } from "react";
import type { FormEvent } from "react";
import type { Player } from "../api/players";
import type { Availability, SessionPlayer } from "../api/sessions";
import { commonStyles } from "../styles/common";
import { useTranslation } from "../i18n/useTranslation";

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
  const { t } = useTranslation();
  const assignedPlayerIds = useMemo(() => new Set(availability.map((entry) => entry.player_id)), [availability]);

  // Include all players, but mark assigned ones differently
  const playerOptions = useMemo(
    () =>
      players.map((p) => ({
        value: p.id,
        label: assignedPlayerIds.has(p.id) ? `${p.name} (${t.alreadyAssigned})` : p.name,
        isAssigned: assignedPlayerIds.has(p.id),
      })),
    [players, assignedPlayerIds, t],
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
    ? players.find((p) => p.id === form.player_ids[0])?.name || "Inconnu"
    : null;

  return (
    <section style={commonStyles.section}>
      <h2 style={commonStyles.subheading}>{t.manageAvailability}</h2>
      {isEditing && editingPlayerName && (
        <p style={{ ...commonStyles.muted, marginBottom: "0.5rem", fontStyle: "italic" }}>
          {t.editingAvailabilityFor(editingPlayerName)}
        </p>
      )}
      {error && <p style={commonStyles.error}>{error}</p>}
      <form onSubmit={onSubmit} style={commonStyles.form}>
        <label style={{ ...commonStyles.field, gridColumn: "1 / -1" }}>
          <span style={commonStyles.label}>{t.player}</span>
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
                {t.allPlayersAssigned}
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
              {t.playersSelected(form.player_ids.length)}
            </p>
          )}
        </label>

        <label style={commonStyles.field}>
          <span style={commonStyles.label}>{t.availability}</span>
          <select
            style={commonStyles.select}
            value={form.availability}
            onChange={(e) => onFormChange({ ...form, availability: e.target.value as Availability })}
          >
            <option value="YES">{t.yes}</option>
            <option value="NO">{t.no}</option>
            <option value="MAYBE">{t.maybe}</option>
          </select>
        </label>

        <label style={commonStyles.checkboxRow}>
          <input
            type="checkbox"
            checked={form.is_goalkeeper}
            onChange={(e) => onFormChange({ ...form, is_goalkeeper: e.target.checked })}
          />
          <span style={commonStyles.checkboxLabel}>{t.goalkeeper}</span>
        </label>

        <button style={commonStyles.button} type="submit">
          {isEditing ? t.updateAvailability : t.saveAvailability}
        </button>
      </form>

      <div>
        <h3 style={commonStyles.smallHeading}>{t.currentAvailability}</h3>
        {availability.length === 0 && <p>{t.noEntriesYet}</p>}
        {availability.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ ...commonStyles.table, minWidth: "600px" }}>
              <thead>
                <tr>
                  <th style={commonStyles.th}>{t.player}</th>
                  <th style={commonStyles.th}>{t.availability}</th>
                  <th style={commonStyles.th}>{t.team}</th>
                  <th style={commonStyles.th}>{t.goalkeeperShort}</th>
                  <th style={{ ...commonStyles.th, width: "80px", textAlign: "center" }}>{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {availability.map((entry) => {
                  const playerName = players.find((p) => p.id === entry.player_id)?.name || entry.player_id;
                  return (
                    <tr key={entry.id}>
                      <td style={commonStyles.td}>{playerName}</td>
                      <td style={commonStyles.td}>{entry.availability === "YES" ? t.yes : entry.availability === "NO" ? t.no : t.maybe}</td>
                      <td style={commonStyles.td}>{entry.team ?? "—"}</td>
                      <td style={commonStyles.td}>{entry.is_goalkeeper ? t.yes : t.no}</td>
                      <td style={{ ...commonStyles.td, textAlign: "center" }}>
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
                          {t.edit}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
});

