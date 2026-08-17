import { useState } from "react";
import type { SessionTemplate } from "../api/templates";
import { createSessionFromTemplate } from "../api/templates";
import { commonStyles } from "../styles/common";
import { useTranslation } from "../i18n/useTranslation";
import { fromDatetimeLocalValue, toDatetimeLocalValue } from "../utils/datetimeLocal";
import { Modal } from "./ui/Modal";

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
  const { t } = useTranslation();
  const [date, setDate] = useState(() => {
    const today = new Date();
    if (template.day_of_week !== null) {
      const daysAhead = template.day_of_week - today.getDay();
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + (daysAhead < 0 ? daysAhead + 7 : daysAhead || 7));
      return toDatetimeLocalValue(nextDate);
    }
    return toDatetimeLocalValue(today);
  });
  const [maxPlayers, setMaxPlayers] = useState(template.max_players);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const session = await createSessionFromTemplate(template.id, {
        date: fromDatetimeLocalValue(date).toISOString(),
        max_players: maxPlayers !== template.max_players ? maxPlayers : undefined,
      });
      onSuccess(session.id);
      onClose();
    } catch (err) {
      setError(t.failedToCreateSessionFromTemplate);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={true} title={t.createSessionFromTemplate} onClose={onClose}>
      <div style={{ marginBottom: "1rem" }}>
        <p>
          <strong>Modèle:</strong> {template.name}
        </p>
        <p>
          <strong>{t.location}:</strong> {template.location}
        </p>
        <p>
          <strong>{t.time}:</strong> {template.time_of_day}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="form-grid" style={{ gridTemplateColumns: "1fr" }}>
        <label style={commonStyles.field}>
          <span style={commonStyles.label}>{t.date}</span>
          <input
            type="datetime-local"
            className="field-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </label>

        <label style={commonStyles.field}>
          <span style={commonStyles.label}>{t.maxPlayersLabel}</span>
          <input
            type="number"
            min={2}
            max={30}
            className="field-input"
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(Number(e.target.value))}
          />
        </label>

        {error && <p className="text-error">{error}</p>}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? t.creating : t.createSession}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            {t.cancel}
          </button>
        </div>
      </form>
    </Modal>
  );
}
