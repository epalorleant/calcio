import { memo } from "react";
import type { SessionTemplate } from "../api/templates";
import { commonStyles } from "../styles/common";
import { useTranslation } from "../i18n/useTranslation";

interface TemplateCardProps {
  template: SessionTemplate;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  onCreateSession: (id: number) => void;
  onGenerateRecurring: (id: number) => void;
}

export const TemplateCard = memo(function TemplateCard({
  template,
  onEdit,
  onDelete,
  onCreateSession,
  onGenerateRecurring,
}: TemplateCardProps) {
  const { t } = useTranslation();
  const dayNames = [t.monday, t.tuesday, t.wednesday, t.thursday, t.friday, t.saturday, t.sunday];
  const dayName = template.day_of_week !== null ? dayNames[template.day_of_week] : t.oneTime;

  const formatTime = (timeStr: string) => {
    // timeStr is in HH:MM format
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const hasRecurrence = template.recurrence_type && template.recurrence_type !== "NONE";

  return (
    <div style={commonStyles.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "1rem" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <h3 style={{ ...commonStyles.smallHeading, margin: 0 }}>{template.name}</h3>
            {!template.active && (
              <span style={{ ...commonStyles.muted, fontSize: "0.85rem", fontStyle: "italic" }}>(Inactif)</span>
            )}
          </div>
          {template.description && (
            <p style={{ ...commonStyles.muted, marginBottom: "0.5rem" }}>{template.description}</p>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.5rem" }}>
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
                  <strong>{t.recurrenceType}:</strong> {template.recurrence_type === "WEEKLY" ? t.weekly : template.recurrence_type === "BIWEEKLY" ? t.biweekly : t.monthly}
                </p>
                {template.recurrence_start && template.recurrence_end && (
                  <p style={{ margin: "0.25rem 0", ...commonStyles.muted }}>
                    {new Date(template.recurrence_start).toLocaleDateString()} -{" "}
                    {new Date(template.recurrence_end).toLocaleDateString()}
                  </p>
                )}
              </>
            )}
            <p style={{ margin: "0.25rem 0", ...commonStyles.muted }}>
              {t.sessionsCreated(template.session_count ?? 0)}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexDirection: "column", minWidth: "140px" }}>
          <button style={commonStyles.button} onClick={() => onCreateSession(template.id)}>
            {t.createSessionFromTemplate}
          </button>
          {hasRecurrence && (
            <button
              style={{ ...commonStyles.button, backgroundColor: "#059669" }}
              onClick={() => onGenerateRecurring(template.id)}
            >
              {t.generateRecurring}
            </button>
          )}
          <button
            style={{ ...commonStyles.button, backgroundColor: "#6b7280" }}
            onClick={() => onEdit(template.id)}
          >
            {t.edit}
          </button>
          <button
            style={{ ...commonStyles.button, backgroundColor: "#dc2626" }}
            onClick={() => onDelete(template.id)}
          >
            {t.delete}
          </button>
        </div>
      </div>
    </div>
  );
});

