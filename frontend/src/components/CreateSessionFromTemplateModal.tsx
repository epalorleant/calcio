import { useState } from "react";
import type { SessionTemplate } from "../api/templates";
import { createSessionFromTemplate } from "../api/templates";
import { commonStyles } from "../styles/common";

interface CreateSessionFromTemplateModalProps {
  template: SessionTemplate;
  onClose: () => void;
  onSuccess: (sessionId: number) => void;
}

export function CreateSessionFromTemplateModal({
  template,
  onClose,
  onSuccess,
}: CreateSessionFromTemplateModalProps) {
  const [date, setDate] = useState(() => {
    // Default to next occurrence of the day of week, or today
    const today = new Date();
    if (template.day_of_week !== null) {
      const daysAhead = template.day_of_week - today.getDay();
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + (daysAhead < 0 ? daysAhead + 7 : daysAhead || 7));
      return nextDate.toISOString().slice(0, 16);
    }
    return today.toISOString().slice(0, 16);
  });
  const [maxPlayers, setMaxPlayers] = useState(template.max_players);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const sessionDate = new Date(date);
      // Combine with template time
      const [hours, minutes] = template.time_of_day.split(":").map(Number);
      sessionDate.setHours(hours, minutes, 0, 0);

      const session = await createSessionFromTemplate(template.id, {
        date: sessionDate.toISOString(),
        max_players: maxPlayers !== template.max_players ? maxPlayers : undefined,
      });

      onSuccess(session.id);
      onClose();
    } catch (err) {
      setError("Failed to create session");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          ...commonStyles.card,
          maxWidth: "500px",
          width: "90%",
          zIndex: 1001,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={commonStyles.heading}>Create Session from Template</h2>
        <div style={{ marginBottom: "1rem" }}>
          <p>
            <strong>Template:</strong> {template.name}
          </p>
          <p>
            <strong>Location:</strong> {template.location}
          </p>
          <p>
            <strong>Time:</strong> {template.time_of_day}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={commonStyles.form}>
          <label style={commonStyles.field}>
            <span style={commonStyles.label}>Date</span>
            <input
              type="datetime-local"
              style={commonStyles.input}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </label>

          <label style={commonStyles.field}>
            <span style={commonStyles.label}>Max Players</span>
            <input
              type="number"
              min={2}
              max={30}
              style={commonStyles.input}
              value={maxPlayers}
              onChange={(e) => setMaxPlayers(Number(e.target.value))}
            />
          </label>

          {error && <p style={commonStyles.error}>{error}</p>}

          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
            <button type="submit" style={commonStyles.button} disabled={loading}>
              {loading ? "Creating..." : "Create Session"}
            </button>
            <button
              type="button"
              style={{ ...commonStyles.button, backgroundColor: "#6b7280" }}
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

