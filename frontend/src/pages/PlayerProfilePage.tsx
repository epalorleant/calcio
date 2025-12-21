import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getPlayerProfile, type PlayerProfile } from "../api/players";
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

  const [profile, setProfile] = useState<PlayerProfile | null>(null);
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

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getPlayerProfile(playerId);
        setProfile(data);
      } catch (err) {
        console.error(err);
        setError(t.failedToLoadPlayer);
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
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

  if (!profile) {
    return (
      <div style={commonStyles.container}>
        <p style={commonStyles.error}>{t.playerNotFound}</p>
        <button style={commonStyles.button} onClick={() => navigate("/players")}>
          {t.back}
        </button>
      </div>
    );
  }

  const { player, stats_summary, match_history } = profile;

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

      {/* Player Information */}
      <div style={commonStyles.card}>
        <h2 style={{ ...commonStyles.subheading, fontSize: "1.25rem", marginBottom: "1rem" }}>
          {t.playerInformation || "Player Information"}
        </h2>
        <div style={{ display: "grid", gap: "1rem" }}>
          <div>
            <label style={{ ...commonStyles.label, marginBottom: "0.5rem", display: "block" }}>
              {t.playerName}
            </label>
            <div
              style={{
                padding: "0.75rem",
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                color: "#1e293b",
                fontSize: "1rem",
                fontWeight: "500",
              }}
            >
              {player.name}
            </div>
          </div>

          <div>
            <label style={{ ...commonStyles.label, marginBottom: "0.5rem", display: "block" }}>
              {t.preferredPosition}
            </label>
            <div
              style={{
                padding: "0.75rem",
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                color: "#1e293b",
                fontSize: "1rem",
              }}
            >
              {player.preferred_position || "—"}
            </div>
          </div>

          <div>
            <label style={{ ...commonStyles.label, marginBottom: "0.5rem", display: "block" }}>
              {t.status}
            </label>
            <div
              style={{
                padding: "0.75rem",
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                color: "#1e293b",
                fontSize: "1rem",
              }}
            >
              {player.active ? t.active : t.inactive}
            </div>
          </div>

          <div>
            <label style={{ ...commonStyles.label, marginBottom: "0.5rem", display: "block" }}>
              {t.overallRating}
            </label>
            <div
              style={{
                padding: "0.75rem",
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                color: "#1e293b",
                fontSize: "1rem",
                fontWeight: "600",
              }}
            >
              {player.rating ? (
                <>
                  {player.rating.overall_rating.toFixed(1)}
                  {player.rating.last_updated_at && (
                    <span style={{ fontSize: "0.875rem", color: "#64748b", marginLeft: "0.5rem", fontWeight: "normal" }}>
                      ({t.lastUpdated}: {formatDate(player.rating.last_updated_at)})
                    </span>
                  )}
                </>
              ) : (
                <span style={{ color: "#94a3b8" }}>—</span>
              )}
            </div>
          </div>

          <div>
            <label style={{ ...commonStyles.label, marginBottom: "0.5rem", display: "block" }}>
              {t.createdAt}
            </label>
            <div
              style={{
                padding: "0.75rem",
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "6px",
                color: "#1e293b",
                fontSize: "1rem",
              }}
            >
              {formatDate(player.created_at)}
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Summary */}
      <div style={{ ...commonStyles.card, marginTop: "1.5rem" }}>
        <h2 style={{ ...commonStyles.subheading, fontSize: "1.25rem", marginBottom: "1rem" }}>
          {t.statistics}
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "1.5rem",
          }}
        >
          <div>
            <div style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "0.5rem", fontWeight: "500" }}>
              {t.totalMatches}
            </div>
            <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#1e293b" }}>
              {stats_summary.total_matches}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "0.5rem", fontWeight: "500" }}>
              {t.totalGoals}
            </div>
            <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#1e293b" }}>
              {stats_summary.total_goals}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "0.5rem", fontWeight: "500" }}>
              {t.totalAssists}
            </div>
            <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#1e293b" }}>
              {stats_summary.total_assists}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "0.5rem", fontWeight: "500" }}>
              {t.totalMinutes}
            </div>
            <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#1e293b" }}>
              {stats_summary.total_minutes_played}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "0.5rem", fontWeight: "500" }}>
              {t.avgGoalsPerMatch}
            </div>
            <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#1e293b" }}>
              {stats_summary.average_goals_per_match.toFixed(2)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.875rem", color: "#64748b", marginBottom: "0.5rem", fontWeight: "500" }}>
              {t.avgAssistsPerMatch}
            </div>
            <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#1e293b" }}>
              {stats_summary.average_assists_per_match.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Match History */}
      {match_history.length > 0 && (
        <div style={{ ...commonStyles.card, marginTop: "1.5rem" }}>
          <h2 style={{ ...commonStyles.heading, fontSize: "1.25rem", marginBottom: "1rem" }}>
            {t.matchHistory || "Match History"}
          </h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #334155" }}>
                  <th style={{ ...commonStyles.label, textAlign: "left", padding: "0.5rem" }}>
                    {t.date || "Date"}
                  </th>
                  <th style={{ ...commonStyles.label, textAlign: "left", padding: "0.5rem" }}>
                    {t.location || "Location"}
                  </th>
                  <th style={{ ...commonStyles.label, textAlign: "left", padding: "0.5rem" }}>
                    {t.team || "Team"}
                  </th>
                  <th style={{ ...commonStyles.label, textAlign: "left", padding: "0.5rem" }}>
                    {t.score || "Score"}
                  </th>
                  <th style={{ ...commonStyles.label, textAlign: "left", padding: "0.5rem" }}>
                    {t.goals || "Goals"}
                  </th>
                  <th style={{ ...commonStyles.label, textAlign: "left", padding: "0.5rem" }}>
                    {t.assists || "Assists"}
                  </th>
                  <th style={{ ...commonStyles.label, textAlign: "left", padding: "0.5rem" }}>
                    {t.minutes || "Minutes"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {match_history.map((match) => (
                  <tr key={match.match_id} style={{ borderBottom: "1px solid #1e293b" }}>
                    <td style={{ padding: "0.5rem" }}>
                      <button
                        style={{
                          background: "none",
                          border: "none",
                          color: "#60a5fa",
                          cursor: "pointer",
                          textDecoration: "underline",
                          padding: 0,
                        }}
                        onClick={() => navigate(`/sessions/${match.session_id}`)}
                      >
                        {formatDate(match.session_date)}
                      </button>
                    </td>
                    <td style={{ padding: "0.5rem" }}>{match.session_location}</td>
                    <td style={{ padding: "0.5rem" }}>Team {match.team}</td>
                    <td style={{ padding: "0.5rem" }}>
                      {match.score_team_a} - {match.score_team_b}
                    </td>
                    <td style={{ padding: "0.5rem" }}>{match.goals}</td>
                    <td style={{ padding: "0.5rem" }}>{match.assists}</td>
                    <td style={{ padding: "0.5rem" }}>{match.minutes_played}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

