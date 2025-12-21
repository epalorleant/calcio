import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteUser, getUsers, grantAdminRole, linkUserToPlayer, type User } from "../api/auth";
import { getPlayers, type Player } from "../api/players";
import { useAuth } from "../auth/AuthContext";
import { useTranslation } from "../i18n/useTranslation";
import { commonStyles } from "../styles/common";

export default function AdminManagementPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
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
      } catch (err: any) {
        console.error(err);
        if (err.response?.data?.detail) {
          setError(String(err.response.data.detail));
        } else {
          setError(t.failedToLoadUsers);
        }
      } finally {
        setLoading(false);
      }
    };

    void loadUsers();
  }, [isRoot, t]);

  const handleGrantAdmin = async (userId: number, username: string) => {
    const confirmed = window.confirm(t.grantAdminConfirm(username));
    if (!confirmed) return;

    try {
      setError(null);
      setSuccess(null);
      await grantAdminRole({ user_id: userId });
      setSuccess(t.adminRoleGranted);
      // Reload users
      const data = await getUsers();
      setUsers(data);
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.detail) {
        setError(String(err.response.data.detail));
      } else {
        setError(t.failedToGrantAdmin);
      }
    }
  };

  const handleLinkPlayer = async (userId: number, playerId: number | null) => {
    try {
      setError(null);
      setSuccess(null);
      await linkUserToPlayer({ user_id: userId, player_id: playerId });
      setSuccess(playerId ? t.playerLinked : t.playerUnlinked);
      // Reload users
      const data = await getUsers();
      setUsers(data);
      setLinkingUserId(null);
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.detail) {
        setError(String(err.response.data.detail));
      } else {
        setError(t.failedToLinkPlayer);
      }
    }
  };

  const handleDeleteUser = async (userId: number, username: string) => {
    const confirmed = window.confirm(
      t.deleteUserConfirm?.(username) || `Are you sure you want to delete the account for ${username}? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      setError(null);
      setSuccess(null);
      await deleteUser(userId);
      setSuccess(t.userDeleted || "User account deleted successfully");
      // Reload users
      const data = await getUsers();
      setUsers(data);
    } catch (err: any) {
      console.error(err);
      if (err.response?.data?.detail) {
        setError(String(err.response.data.detail));
      } else {
        setError(t.failedToDeleteUser || "Failed to delete user account");
      }
    }
  };

  if (!isRoot) {
    return (
      <div style={commonStyles.container}>
        <p style={commonStyles.error}>{t.accessDenied}</p>
        <button style={commonStyles.button} onClick={() => navigate("/")}>
          {t.back}
        </button>
      </div>
    );
  }

  return (
    <div style={commonStyles.container}>
      <div style={{ marginBottom: "1.5rem" }}>
        <button
          style={{ ...commonStyles.button, marginBottom: "1rem" }}
          onClick={() => navigate(-1)}
        >
          {t.back}
        </button>
        <h1 style={commonStyles.heading}>{t.adminManagement}</h1>
      </div>

      {error && <p style={commonStyles.error}>{error}</p>}
      {success && <p style={{ ...commonStyles.success, color: "#10b981" }}>{success}</p>}

      {loading ? (
        <p>{t.loading}</p>
      ) : (
        <div style={commonStyles.card}>
          {users.length === 0 ? (
            <p>{t.noUsers}</p>
          ) : (
            <table style={commonStyles.table}>
              <thead>
                <tr>
                  <th style={commonStyles.th}>{t.username}</th>
                  <th style={commonStyles.th}>{t.email}</th>
                  <th style={commonStyles.th}>{t.status}</th>
                  <th style={commonStyles.th}>{t.role}</th>
                  <th style={commonStyles.th}>{t.playerProfile || "Player"}</th>
                  <th style={commonStyles.th}>{t.actions}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td style={commonStyles.td}>{u.username}</td>
                    <td style={commonStyles.td}>{u.email}</td>
                    <td style={commonStyles.td}>
                      {u.is_active ? t.active : t.inactive}
                    </td>
                    <td style={commonStyles.td}>
                      {u.is_root
                        ? t.rootUser
                        : u.is_admin
                        ? t.adminUser
                        : t.regularUser}
                    </td>
                    <td style={commonStyles.td}>
                      {u.player_id ? (
                        <span style={{ color: "#10b981" }}>
                          {players.find((p) => p.id === u.player_id)?.name || `ID: ${u.player_id}`}
                        </span>
                      ) : (
                        <span style={{ color: "#94a3b8" }}>—</span>
                      )}
                    </td>
                    <td style={commonStyles.td}>
                      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                        {!u.is_root && !u.is_admin && (
                          <button
                            style={commonStyles.button}
                            onClick={() => handleGrantAdmin(u.id, u.username)}
                          >
                            {t.grantAdmin}
                          </button>
                        )}
                        {!u.is_root && (
                          <button
                            style={{ ...commonStyles.button, backgroundColor: "#b91c1c", color: "#fff" }}
                            onClick={() => handleDeleteUser(u.id, u.username)}
                          >
                            {t.delete}
                          </button>
                        )}
                        {linkingUserId === u.id ? (
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", minWidth: "200px" }}>
                            <select
                              style={commonStyles.select}
                              value={u.player_id || ""}
                              onChange={(e) => {
                                const playerId = e.target.value ? Number(e.target.value) : null;
                                
                                // If user already has a player and trying to link to a different one, show error
                                if (u.player_id && playerId && playerId !== u.player_id) {
                                  setError(t.userAlreadyLinked || "User account is already linked to a player. Please unlink first.");
                                  return;
                                }
                                
                                // If trying to link to a player that's already linked to another user, show error
                                if (playerId) {
                                  const linkedToOtherUser = users.find(
                                    (otherUser) => otherUser.id !== u.id && otherUser.player_id === playerId
                                  );
                                  if (linkedToOtherUser) {
                                    setError(t.playerAlreadyLinked || "Player is already linked to another user account.");
                                    return;
                                  }
                                }
                                
                                void handleLinkPlayer(u.id, playerId);
                              }}
                            >
                              <option value="">{t.unlinkPlayer || "Unlink player"}</option>
                              {players
                                .filter((p) => {
                                  // Show player if:
                                  // 1. It's already linked to this user, OR
                                  // 2. It's not linked to any other user AND user doesn't have a player
                                  const linkedToOtherUser = users.find(
                                    (otherUser) => otherUser.id !== u.id && otherUser.player_id === p.id
                                  );
                                  const isCurrentPlayer = p.id === u.player_id;
                                  const isAvailable = !linkedToOtherUser && !u.player_id;
                                  return isCurrentPlayer || isAvailable;
                                })
                                .map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name} {p.id === u.player_id ? "(current)" : ""}
                                  </option>
                                ))}
                            </select>
                            <button
                              style={{ ...commonStyles.button, fontSize: "0.85rem", padding: "0.25rem 0.5rem" }}
                              onClick={() => {
                                setLinkingUserId(null);
                                setError(null);
                              }}
                            >
                              {t.cancel}
                            </button>
                          </div>
                        ) : (
                          <button
                            style={{ ...commonStyles.button, fontSize: "0.85rem", padding: "0.25rem 0.5rem" }}
                            onClick={() => setLinkingUserId(u.id)}
                          >
                            {u.player_id ? t.changePlayerLink || "Change link" : t.linkPlayer || "Link player"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

