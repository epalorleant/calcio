import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { createPlayer, deletePlayer, getPlayers, updatePlayer, type Player, type PlayerCreate } from "../api/players";
import { useTranslation } from "../i18n/useTranslation";
import { useAuth } from "../auth/AuthContext";
import { ResponsiveTable } from "../components/ui/ResponsiveTable";
import { useConfirmDialog } from "../components/ui/ConfirmDialog";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { PageHeader } from "../components/layout/PageHeader";

export default function PlayersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const isAdmin = user?.is_admin || user?.is_root;
  const { confirm } = useConfirmDialog();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<PlayerCreate>({
    name: "",
    preferred_position: "",
    active: true,
  });

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPlayers();
      if (!Array.isArray(data)) {
        setError(t.unexpectedResponse);
        setPlayers([]);
        return;
      }
      setPlayers(data);
    } catch (err) {
      console.error(err);
      setError(t.failedToLoadPlayers);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchPlayers();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError(t.nameRequired);
      return;
    }
    try {
      setError(null);
      await createPlayer({
        name: form.name.trim(),
        preferred_position: form.preferred_position?.trim() || undefined,
        active: form.active ?? true,
      });
      setForm({ name: "", preferred_position: "", active: true });
      await fetchPlayers();
    } catch (err) {
      console.error(err);
      setError(t.failedToCreatePlayer);
    }
  };

  const toggleActive = async (player: Player) => {
    try {
      setError(null);
      await updatePlayer(player.id, {
        name: player.name,
        preferred_position: player.preferred_position,
        active: !player.active,
      });
      await fetchPlayers();
    } catch (err) {
      console.error(err);
      setError(t.failedToUpdatePlayer);
    }
  };

  const handleDelete = async (player: Player) => {
    const confirmed = await confirm({
      message: t.deletePlayerConfirm(player.name),
      variant: "danger",
      confirmLabel: t.delete,
    });
    if (!confirmed) return;
    try {
      setError(null);
      await deletePlayer(player.id);
      await fetchPlayers();
    } catch (err) {
      console.error(err);
      setError(t.failedToDeletePlayer);
    }
  };

  return (
    <div className="page-container">
      <PageHeader title={t.playersPage} />

      {isAdmin && (
        <form onSubmit={handleSubmit} className="form-grid">
          <input
            className="field-input"
            type="text"
            placeholder={t.playerName}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <input
            className="field-input"
            type="text"
            placeholder={t.preferredPosition}
            value={form.preferred_position ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, preferred_position: e.target.value }))}
          />
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={form.active ?? true}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            />
            <span>{t.active}</span>
          </label>
          <button className="btn btn-primary" type="submit">
            {t.addPlayer}
          </button>
        </form>
      )}

      {!isAuthenticated && <p className="text-muted" style={{ fontStyle: "italic", marginBottom: "1rem" }}>{t.readOnlyMode}</p>}

      {loading && <LoadingSpinner label={t.loadingPlayers} />}
      {error && <p className="text-error">{error}</p>}
      {!loading && players.length === 0 && <p>{t.noPlayers}</p>}

      {!loading && players.length > 0 && (
        <ResponsiveTable
          data={players}
          getRowKey={(player) => player.id}
          columns={[
            {
              key: "name",
              header: t.playerName,
              render: (player) => {
                const canViewProfile = isAdmin || (isAuthenticated && user?.player_id === player.id);
                return canViewProfile ? (
                  <button className="btn-action" onClick={() => navigate(`/players/${player.id}`)}>
                    {player.name}
                  </button>
                ) : (
                  player.name
                );
              },
            },
            { key: "position", header: t.preferredPosition, render: (player) => player.preferred_position || "—" },
            { key: "rating", header: "Note", render: (player) => (player.rating ? player.rating.overall_rating.toFixed(1) : "—") },
            { key: "active", header: t.active, render: (player) => (player.active ? t.yes : t.no) },
          ]}
          actions={
            isAdmin
              ? (player) => (
                  <>
                    <button className="btn-action" onClick={() => void toggleActive(player)}>
                      {player.active ? t.deactivate : t.activate}
                    </button>
                    <button className="btn-action btn-action-danger" onClick={() => void handleDelete(player)}>
                      {t.delete}
                    </button>
                  </>
                )
              : undefined
          }
        />
      )}
    </div>
  );
}
