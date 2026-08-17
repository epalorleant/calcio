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
import { useTranslation } from "../i18n/useTranslation";
import { useDateFormat } from "../hooks/useDateFormat";
import { useConfirmDialog } from "../components/ui/ConfirmDialog";
import { useToast } from "../components/ui/Toast";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { PageHeader } from "../components/layout/PageHeader";

export default function TemplatesPage() {
  const { t } = useTranslation();
  const { formatDateOnly } = useDateFormat();
  const navigate = useNavigate();
  const { confirm } = useConfirmDialog();
  const { showToast } = useToast();
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
      setError(t.failedToLoadTemplates);
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
    const template = templates.find((tpl) => tpl.id === id);
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
      setError(editingTemplate ? t.failedToUpdateTemplate : t.failedToCreateTemplate);
    }
  };

  const handleDelete = async (id: number) => {
    const confirmed = await confirm({
      message: t.deleteTemplateConfirm,
      variant: "danger",
      confirmLabel: t.delete,
    });
    if (!confirmed) return;
    try {
      setError(null);
      await deleteTemplate(id);
      await loadTemplates();
    } catch (err) {
      console.error(err);
      setError(t.failedToDeleteTemplate);
    }
  };

  const handleCreateSession = (id: number) => {
    const template = templates.find((tpl) => tpl.id === id);
    if (template) setCreateSessionTemplate(template);
  };

  const handleSessionCreated = (sessionId: number) => {
    navigate(`/sessions/${sessionId}`);
  };

  const handleGenerateRecurring = async (id: number) => {
    const template = templates.find((tpl) => tpl.id === id);
    if (!template) return;

    const startDate = template.recurrence_start ? formatDateOnly(template.recurrence_start) : t.start;
    const endDate = template.recurrence_end ? formatDateOnly(template.recurrence_end) : t.end;
    const confirmed = await confirm({
      message: t.generateRecurringConfirm(template.name, startDate, endDate),
      confirmLabel: t.generateRecurring,
    });
    if (!confirmed) return;

    try {
      setError(null);
      setLoading(true);
      const sessions = await generateRecurringSessions(id);
      showToast(t.successfullyCreated(sessions.length), "success");
      await loadTemplates();
    } catch (err) {
      console.error(err);
      setError(t.failedToGenerateRecurring);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <PageHeader
        title={t.sessionTemplates}
        action={
          <button className="btn btn-primary" onClick={handleCreate}>
            {t.createTemplate}
          </button>
        }
      />

      {showForm && (
        <div className="card">
          <h2 style={commonStyles.subheading}>{editingTemplate ? t.editTemplate : t.createTemplate}</h2>
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
          {loading && <LoadingSpinner label={t.loadingTemplates} />}
          {error && <p className="text-error">{error}</p>}
          {!loading && templates.length === 0 && <p>{t.noTemplates}</p>}

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
