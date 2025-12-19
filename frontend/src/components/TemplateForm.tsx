import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { RecurrenceType, SessionTemplate, SessionTemplateCreate, SessionTemplateUpdate } from "../api/templates";
import { commonStyles } from "../styles/common";

interface TemplateFormProps {
  template?: SessionTemplate | null;
  onSubmit: (data: SessionTemplateCreate | SessionTemplateUpdate) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
}

export function TemplateForm({ template, onSubmit, onCancel, loading = false, error }: TemplateFormProps) {
  const [form, setForm] = useState<SessionTemplateCreate>({
    name: template?.name || "",
    description: template?.description || null,
    location: template?.location || "",
    time_of_day: template?.time_of_day || "18:00",
    day_of_week: template?.day_of_week ?? null,
    max_players: template?.max_players || 10,
    recurrence_type: template?.recurrence_type || null,
    recurrence_start: template?.recurrence_start || null,
    recurrence_end: template?.recurrence_end || null,
  });

  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType | "">(
    (template?.recurrence_type as RecurrenceType) || ""
  );

  const dayNames = [
    { value: null, label: "One-time" },
    { value: 0, label: "Monday" },
    { value: 1, label: "Tuesday" },
    { value: 2, label: "Wednesday" },
    { value: 3, label: "Thursday" },
    { value: 4, label: "Friday" },
    { value: 5, label: "Saturday" },
    { value: 6, label: "Sunday" },
  ];

  useEffect(() => {
    if (recurrenceType === "" || recurrenceType === "NONE") {
      setForm((prev) => ({
        ...prev,
        recurrence_type: null,
        recurrence_start: null,
        recurrence_end: null,
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        recurrence_type: recurrenceType as RecurrenceType,
      }));
    }
  }, [recurrenceType]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (template) {
      // Update mode - only send changed fields
      const updateData: SessionTemplateUpdate = {};
      if (form.name !== template.name) updateData.name = form.name;
      if (form.description !== template.description) updateData.description = form.description;
      if (form.location !== template.location) updateData.location = form.location;
      if (form.time_of_day !== template.time_of_day) updateData.time_of_day = form.time_of_day;
      if (form.day_of_week !== template.day_of_week) updateData.day_of_week = form.day_of_week;
      if (form.max_players !== template.max_players) updateData.max_players = form.max_players;
      if (form.recurrence_type !== template.recurrence_type) updateData.recurrence_type = form.recurrence_type;
      if (form.recurrence_start !== template.recurrence_start) updateData.recurrence_start = form.recurrence_start;
      if (form.recurrence_end !== template.recurrence_end) updateData.recurrence_end = form.recurrence_end;
      await onSubmit(updateData);
    } else {
      // Create mode
      await onSubmit(form);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ ...commonStyles.form, maxWidth: "600px", width: "100%" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <label style={commonStyles.field}>
          <span style={commonStyles.label}>Name *</span>
          <input
            type="text"
            style={commonStyles.input}
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            required
            maxLength={255}
          />
        </label>

        <label style={commonStyles.field}>
          <span style={commonStyles.label}>Description</span>
          <textarea
            style={commonStyles.textarea}
            rows={3}
            value={form.description || ""}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value || null }))}
            maxLength={1000}
          />
        </label>

        <label style={commonStyles.field}>
          <span style={commonStyles.label}>Location *</span>
          <input
            type="text"
            style={commonStyles.input}
            value={form.location}
            onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
            required
            maxLength={255}
          />
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          <label style={commonStyles.field}>
            <span style={commonStyles.label}>Time *</span>
            <input
              type="time"
              style={commonStyles.input}
              value={form.time_of_day}
              onChange={(e) => setForm((prev) => ({ ...prev, time_of_day: e.target.value }))}
              required
            />
          </label>

          <label style={commonStyles.field}>
            <span style={commonStyles.label}>Day of Week</span>
            <select
              style={commonStyles.select}
              value={form.day_of_week === null ? "" : form.day_of_week}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  day_of_week: e.target.value === "" ? null : Number(e.target.value),
                }))
              }
            >
              {dayNames.map((day) => (
                <option key={day.value ?? "null"} value={day.value ?? ""}>
                  {day.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label style={commonStyles.field}>
          <span style={commonStyles.label}>Max Players *</span>
          <input
            type="number"
            min={2}
            max={30}
            style={commonStyles.input}
            value={form.max_players}
            onChange={(e) => setForm((prev) => ({ ...prev, max_players: Number(e.target.value) }))}
            required
          />
        </label>

        <label style={commonStyles.field}>
          <span style={commonStyles.label}>Recurrence Type</span>
          <select
            style={commonStyles.select}
            value={recurrenceType}
            onChange={(e) => setRecurrenceType(e.target.value as RecurrenceType | "")}
          >
            <option value="">None (One-time template)</option>
            <option value="WEEKLY">Weekly</option>
            <option value="BIWEEKLY">Bi-weekly</option>
            <option value="MONTHLY">Monthly</option>
          </select>
        </label>

        {recurrenceType && recurrenceType !== "NONE" && (
          <>
            <label style={commonStyles.field}>
              <span style={commonStyles.label}>Recurrence Start Date *</span>
              <input
                type="datetime-local"
                style={commonStyles.input}
                value={
                  form.recurrence_start
                    ? new Date(form.recurrence_start).toISOString().slice(0, 16)
                    : ""
                }
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    recurrence_start: e.target.value ? new Date(e.target.value).toISOString() : null,
                  }))
                }
                required
              />
            </label>

            <label style={commonStyles.field}>
              <span style={commonStyles.label}>Recurrence End Date *</span>
              <input
                type="datetime-local"
                style={commonStyles.input}
                value={
                  form.recurrence_end
                    ? new Date(form.recurrence_end).toISOString().slice(0, 16)
                    : ""
                }
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    recurrence_end: e.target.value ? new Date(e.target.value).toISOString() : null,
                  }))
                }
                required
              />
            </label>
          </>
        )}

        {error && <p style={commonStyles.error}>{error}</p>}

        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
          <button type="submit" style={commonStyles.button} disabled={loading}>
            {loading ? "Saving..." : template ? "Update Template" : "Create Template"}
          </button>
          <button
            type="button"
            style={{ ...commonStyles.button, backgroundColor: "#6b7280" }}
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}

