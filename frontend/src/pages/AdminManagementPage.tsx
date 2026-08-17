import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteUser, getUsers, grantAdminRole, linkUserToPlayer, type User } from "../api/auth";
import { getPlayers, type Player } from "../api/players";
import { useAuth } from "../auth/AuthContext";
import { useTranslation } from "../i18n/useTranslation";
import { ResponsiveTable } from "../components/ui/ResponsiveTable";
import { useConfirmDialog } from "../components/ui/ConfirmDialog";
import { useToast } from "../components/ui/Toast";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";

export default function AdminManagementPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { confirm } = useConfirmDialog();
  const { showToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkingUserId, setLinkingUserId] = useState<number | null>(null);

  const isRoot = user?.is_root;

  useEffect(() => {
    if (!isRoot) {
      setError(t.accessDenied);
      return;
    }

    const loadUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const [usersData, playersData] = await Promise.all([getUsers(), getPlayers()]);
        setUsers(usersData);
        setPlayers(playersData);
      } catch (err: unknown) {
        console.error(err);
        const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
        setError(detail ? String(detail) : t.failedToLoadUsers);
      } finally {
        setLoading(false);
      }
    };

    void loadUsers();
  }, [isRoot, t]);

  const reloadUsers = async () => {
    const data = await getUsers();
    setUsers(data);
  };

  const handleGrantAdmin = async (userId: number, username: string) => {
    const confirmed = await confirm({
      message: t.grantAdminConfirm(username),
      confirmLabel: t.grantAdmin,
    });
    if (!confirmed) return;

    try {
      setError(null);
      await grantAdminRole({ user_id: userId });
      showToast(t.adminRoleGranted, "success");
      await reloadUsers();
    } catch (err: unknown) {
      console.error(err);
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detail ? String(detail) : t.failedToGrantAdmin);
    }
  };

  const handleLinkPlayer = async (userId: number, playerId: number | null) => {
    try {
      setError(null);
      await linkUserToPlayer({ user_id: userId, player_id: playerId });
      showToast(playerId ? t.playerLinked : t.playerUnlinked, "success");
      await reloadUsers();
      setLinkingUserId(null);
    } catch (err: unknown) {
      console.error(err);
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detail ? String(detail) : t.failedToLinkPlayer);
    }
  };

  const handleDeleteUser = async (userId: number, username: string) => {
    const confirmed = await confirm({
      message: t.deleteUserConfirm(username),
      variant: "danger",
      confirmLabel: t.delete,
    });
    if (!confirmed) return;

    try {
      setError(null);
      await deleteUser(userId);
      showToast(t.userDeleted, "success");
      await reloadUsers();
    } catch (err: unknown) {
      console.error(err);
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detail ? String(detail) : t.failedToDeleteUser);
    }
  };

  if (!isRoot) {
    return (
      <div className="page-container">
        <p className="text-error">{t.accessDenied}</p>
        <button className="btn btn-primary" onClick={() => navigate("/")}>
          {t.back}
        </button>
      </div>
    );
  }

  return (
    <div className="page-container">
      <button className="btn btn-secondary" style={{ marginBottom: "1rem" }} onClick={() => navigate(-1)}>
        {t.back}
      </button>
      <h1 className="page-title">{t.adminManagement}</h1>

      {error && <p className="text-error">{error}</p>}

      {loading ? (
        <LoadingSpinner label={t.loading} />
      ) : (
        <div className="card">
          {users.length === 0 ? (
            <p>{t.noUsers}</p>
          ) : (
            <ResponsiveTable
              data={users}
              getRowKey={(u) => u.id}
              columns={[
                { key: "username", header: t.username, render: (u) => u.username },
                { key: "email", header: t.email, render: (u) => u.email },
                { key: "status", header: t.status, render: (u) => (u.is_active ? t.active : t.inactive) },
                {
                  key: "role",
                  header: t.role,
                  render: (u) => (u.is_root ? t.rootUser : u.is_admin ? t.adminUser : t.regularUser),
                },
                {
                  key: "player",
                  header: t.playerProfile,
                  render: (u) =>
                    u.player_id ? (
                      <span className="text-success">{players.find((p) => p.id === u.player_id)?.name || `ID: ${u.player_id}`}</span>
                    ) : (
                      "—"
                    ),
                },
              ]}
              actions={(u) => (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {!u.is_root && !u.is_admin && (
                    <button className="btn btn-primary btn-sm" onClick={() => void handleGrantAdmin(u.id, u.username)}>
                      {t.grantAdmin}
                    </button>
                  )}
                  {!u.is_root && (
                    <button className="btn btn-danger btn-sm" onClick={() => void handleDeleteUser(u.id, u.username)}>
                      {t.delete}
                    </button>
                  )}
                  {linkingUserId === u.id ? (
                    <>
                      <select
                        className="field-select"
                        value={u.player_id || ""}
                        onChange={(e) => {
                          const playerId = e.target.value ? Number(e.target.value) : null;
                          if (u.player_id && playerId && playerId !== u.player_id) {
                            setError(t.userAlreadyLinked);
                            return;
                          }
                          if (playerId) {
                            const linkedToOtherUser = users.find(
                              (otherUser) => otherUser.id !== u.id && otherUser.player_id === playerId,
                            );
                            if (linkedToOtherUser) {
                              setError(t.playerAlreadyLinked);
                              return;
                            }
                          }
                          void handleLinkPlayer(u.id, playerId);
                        }}
                      >
                        <option value="">{t.unlinkPlayer}</option>
                        {players
                          .filter((p) => {
                            const linkedToOtherUser = users.find(
                              (otherUser) => otherUser.id !== u.id && otherUser.player_id === p.id,
                            );
                            return p.id === u.player_id || (!linkedToOtherUser && !u.player_id);
                          })
                          .map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} {p.id === u.player_id ? "(current)" : ""}
                            </option>
                          ))}
                      </select>
                      <button className="btn btn-secondary btn-sm" onClick={() => { setLinkingUserId(null); setError(null); }}>
                        {t.cancel}
                      </button>
                    </>
                  ) : (
                    <button className="btn btn-secondary btn-sm" onClick={() => setLinkingUserId(u.id)}>
                      {u.player_id ? t.changePlayerLink : t.linkPlayer}
                    </button>
                  )}
                </div>
              )}
            />
          )}
        </div>
      )}
    </div>
  );
}
