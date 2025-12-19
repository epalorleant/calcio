import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createTemplate as createTemplateAPI,
  deleteTemplate,
  generateRecurringSessions,
  getTemplates,
  updateTemplate as updateTemplateAPI,
  type SessionTemplate,
  type SessionTemplateCreate,
  type SessionTemplateUpdate,
} from "../api/templates";
import { TemplateCard } from "../components/TemplateCard";
import { TemplateForm } from "../components/TemplateForm";
import { CreateSessionFromTemplateModal } from "../components/CreateSessionFromTemplateModal";
import { commonStyles } from "../styles/common";

export default function TemplatesPage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<SessionTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<SessionTemplate | null>(null);
  const [createSessionTemplate, setCreateSessionTemplate] = useState<SessionTemplate | null>(null);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTemplates();
      setTemplates(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load templates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTemplates();
  }, []);

  const handleCreate = () => {
    setEditingTemplate(null);
    setShowForm(true);
  };

  const handleEdit = (id: number) => {
    const template = templates.find((t) => t.id === id);
    if (template) {
      setEditingTemplate(template);
      setShowForm(true);
    }
  };

  const handleSubmit = async (data: SessionTemplateCreate | SessionTemplateUpdate) => {
    try {
      setError(null);
      if (editingTemplate) {
        await updateTemplateAPI(editingTemplate.id, data as SessionTemplateUpdate);
      } else {
        await createTemplateAPI(data as SessionTemplateCreate);
      }
      setShowForm(false);
      setEditingTemplate(null);
      await loadTemplates();
    } catch (err) {
      console.error(err);
      setError(editingTemplate ? "Failed to update template." : "Failed to create template.");
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm("Delete this template? Sessions created from this template will not be deleted.");
    if (!confirmed) return;
    try {
      setError(null);
      await deleteTemplate(id);
      await loadTemplates();
    } catch (err) {
      console.error(err);
      setError("Failed to delete template.");
    }
  };

  const handleCreateSession = (id: number) => {
    const template = templates.find((t) => t.id === id);
    if (template) {
      setCreateSessionTemplate(template);
    }
  };

  const handleSessionCreated = (sessionId: number) => {
    navigate(`/sessions/${sessionId}`);
  };

  const handleGenerateRecurring = async (id: number) => {
    const template = templates.find((t) => t.id === id);
    if (!template) return;

    const confirmed = window.confirm(
      `Generate all recurring sessions for "${template.name}"? This will create sessions from ${template.recurrence_start ? new Date(template.recurrence_start).toLocaleDateString() : "start"} to ${template.recurrence_end ? new Date(template.recurrence_end).toLocaleDateString() : "end"}.`
    );
    if (!confirmed) return;

    try {
      setError(null);
      setLoading(true);
      const sessions = await generateRecurringSessions(id);
      alert(`Successfully created ${sessions.length} session${sessions.length !== 1 ? "s" : ""}.`);
      await loadTemplates();
    } catch (err) {
      console.error(err);
      setError("Failed to generate recurring sessions.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div style={commonStyles.container}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h1 style={commonStyles.heading}>Session Templates</h1>
        <button style={commonStyles.button} onClick={handleCreate}>
          Create Template
        </button>
      </div>

      {showForm && (
        <div style={commonStyles.card}>
          <h2 style={commonStyles.subheading}>{editingTemplate ? "Edit Template" : "Create Template"}</h2>
          <TemplateForm
            template={editingTemplate}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingTemplate(null);
            }}
            error={error}
          />
        </div>
      )}

      {!showForm && (
        <>
          {loading && <p>Loading templates...</p>}
          {error && <p style={commonStyles.error}>{error}</p>}
          {!loading && templates.length === 0 && <p>No templates yet. Create your first template!</p>}

          {templates.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onCreateSession={handleCreateSession}
                  onGenerateRecurring={handleGenerateRecurring}
                />
              ))}
            </div>
          )}
        </>
      )}

      {createSessionTemplate && (
        <CreateSessionFromTemplateModal
          template={createSessionTemplate}
          onClose={() => setCreateSessionTemplate(null)}
          onSuccess={handleSessionCreated}
        />
      )}
    </div>
  );
}

