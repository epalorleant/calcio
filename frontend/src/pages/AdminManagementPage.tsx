import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUsers, grantAdminRole, type User } from "../api/auth";
import { useAuth } from "../auth/AuthContext";
import { useTranslation } from "../i18n/useTranslation";
import { commonStyles } from "../styles/common";

export default function AdminManagementPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
        const data = await getUsers();
        setUsers(data);
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
                      {!u.is_root && !u.is_admin && (
                        <button
                          style={commonStyles.button}
                          onClick={() => handleGrantAdmin(u.id, u.username)}
                        >
                          {t.grantAdmin}
                        </button>
                      )}
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

