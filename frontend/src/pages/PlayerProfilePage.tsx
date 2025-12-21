import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getPlayer, type Player } from "../api/players";
import { useAuth } from "../auth/AuthContext";
import { useTranslation } from "../i18n/useTranslation";
import { useDateFormat } from "../hooks/useDateFormat";
import { commonStyles } from "../styles/common";

export default function PlayerProfilePage() {
  const { t } = useTranslation();
  const { formatDate } = useDateFormat();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const playerId = id ? Number(id) : user?.player_id;

  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!playerId) {
      setError(t.playerNotFound);
      return;
    }

    // Regular users can only view their own player profile
    if (user && !user.is_admin && !user.is_root && user.player_id !== playerId) {
      setError(t.accessDenied);
      return;
    }

    const loadPlayer = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getPlayer(playerId);
        setPlayer(data);
      } catch (err) {
        console.error(err);
        setError(t.failedToLoadPlayer);
      } finally {
        setLoading(false);
      }
    };

    void loadPlayer();
  }, [playerId, user, t]);

  if (!playerId) {
    return (
      <div style={commonStyles.container}>
        <p style={commonStyles.error}>{t.playerNotFound}</p>
        <button style={commonStyles.button} onClick={() => navigate("/players")}>
          {t.back}
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={commonStyles.container}>
        <p>{t.loading}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={commonStyles.container}>
        <p style={commonStyles.error}>{error}</p>
        <button style={commonStyles.button} onClick={() => navigate("/players")}>
          {t.back}
        </button>
      </div>
    );
  }

  if (!player) {
    return (
      <div style={commonStyles.container}>
        <p style={commonStyles.error}>{t.playerNotFound}</p>
        <button style={commonStyles.button} onClick={() => navigate("/players")}>
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
          onClick={() => navigate("/players")}
        >
          {t.back}
        </button>
        <h1 style={commonStyles.heading}>{t.playerProfile}</h1>
      </div>

      <div style={commonStyles.card}>
        <div style={{ display: "grid", gap: "1rem" }}>
          <div>
            <label style={commonStyles.label}>{t.playerName}</label>
            <div style={{ ...commonStyles.input, backgroundColor: "#1e293b", border: "none" }}>
              {player.name}
            </div>
          </div>

          {player.preferred_position && (
            <div>
              <label style={commonStyles.label}>{t.preferredPosition}</label>
              <div style={{ ...commonStyles.input, backgroundColor: "#1e293b", border: "none" }}>
                {player.preferred_position}
              </div>
            </div>
          )}

          <div>
            <label style={commonStyles.label}>{t.status}</label>
            <div style={{ ...commonStyles.input, backgroundColor: "#1e293b", border: "none" }}>
              {player.active ? t.active : t.inactive}
            </div>
          </div>

          {player.rating && (
            <div>
              <label style={commonStyles.label}>{t.overallRating}</label>
              <div style={{ ...commonStyles.input, backgroundColor: "#1e293b", border: "none" }}>
                {player.rating.overall_rating.toFixed(0)}
                {player.rating.last_updated_at && (
                  <span style={{ fontSize: "0.85rem", color: "#94a3b8", marginLeft: "0.5rem" }}>
                    ({t.lastUpdated}: {formatDate(player.rating.last_updated_at)})
                  </span>
                )}
              </div>
            </div>
          )}

          <div>
            <label style={commonStyles.label}>{t.createdAt}</label>
            <div style={{ ...commonStyles.input, backgroundColor: "#1e293b", border: "none" }}>
              {formatDate(player.created_at)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

