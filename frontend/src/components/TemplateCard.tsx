import type { SessionTemplate } from "../api/templates";
import { commonStyles } from "../styles/common";
import { useTranslation } from "../i18n/useTranslation";
import { useDateFormat } from "../hooks/useDateFormat";

interface TemplateCardProps {
  template: SessionTemplate;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onCreateSession: (id: number) => void;
  onGenerateRecurring: (id: number) => void;
}

export function TemplateCard({
  template,
  onEdit,
  onDelete,
  onCreateSession,
  onGenerateRecurring,
}: TemplateCardProps) {
  const { t } = useTranslation();
  const { formatDateOnly } = useDateFormat();
  const dayNames = [t.monday, t.tuesday, t.wednesday, t.thursday, t.friday, t.saturday, t.sunday];
  const dayName = template.day_of_week !== null ? dayNames[template.day_of_week] : t.oneTime;

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const hasRecurrence = template.recurrence_type && template.recurrence_type !== "NONE";

  return (
    <div className="card template-card">
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <h3 style={{ ...commonStyles.smallHeading, margin: 0 }}>{template.name}</h3>
          {!template.active && (
            <span className="text-muted" style={{ fontSize: "0.85rem", fontStyle: "italic" }}>
              ({t.inactive})
            </span>
          )}
        </div>
        {template.description && <p className="text-muted" style={{ marginBottom: "0.5rem" }}>{template.description}</p>}
        <div className="template-card-meta">
          <p style={{ margin: "0.25rem 0" }}>
            <strong>{t.location}:</strong> {template.location}
          </p>
          <p style={{ margin: "0.25rem 0" }}>
            <strong>{t.time}:</strong> {formatTime(template.time_of_day)}
            {template.day_of_week !== null && ` (${dayName})`}
          </p>
          <p style={{ margin: "0.25rem 0" }}>
            <strong>{t.maxPlayersLabel}:</strong> {template.max_players}
          </p>
          {hasRecurrence && (
            <>
              <p style={{ margin: "0.25rem 0" }}>
                <strong>{t.recurrenceType}:</strong>{" "}
                {template.recurrence_type === "WEEKLY"
                  ? t.weekly
                  : template.recurrence_type === "BIWEEKLY"
                    ? t.biweekly
                    : t.monthly}
              </p>
              {template.recurrence_start && template.recurrence_end && (
                <p className="text-muted" style={{ margin: "0.25rem 0" }}>
                  {formatDateOnly(template.recurrence_start)} - {formatDateOnly(template.recurrence_end)}
                </p>
              )}
            </>
          )}
          <p className="text-muted" style={{ margin: "0.25rem 0" }}>
            {t.sessionsCreated(template.session_count ?? 0)}
          </p>
        </div>
      </div>
      <div className="template-card-actions">
        <button className="btn btn-primary" onClick={() => onCreateSession(template.id)}>
          {t.createSessionFromTemplate}
        </button>
        {hasRecurrence && (
          <button className="btn btn-primary" style={{ background: "var(--color-success)" }} onClick={() => onGenerateRecurring(template.id)}>
            {t.generateRecurring}
          </button>
        )}
        <button className="btn btn-secondary" onClick={() => onEdit(template.id)}>
          {t.edit}
        </button>
        <button className="btn btn-danger" onClick={() => onDelete(template.id)}>
          {t.delete}
        </button>
      </div>
    </div>
  );
}
