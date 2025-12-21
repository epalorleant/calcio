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
        <h2 style={{ ...commonStyles.heading, fontSize: "1.25rem", marginBottom: "1rem" }}>
          {t.playerInformation || "Player Information"}
        </h2>
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

      {/* Statistics Summary */}
      <div style={{ ...commonStyles.card, marginTop: "1.5rem" }}>
        <h2 style={{ ...commonStyles.heading, fontSize: "1.25rem", marginBottom: "1rem" }}>
          {t.statistics || "Statistics"}
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "1rem",
          }}
        >
          <div>
            <div style={{ fontSize: "0.875rem", color: "#94a3b8", marginBottom: "0.25rem" }}>
              {t.totalMatches || "Total Matches"}
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{stats_summary.total_matches}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.875rem", color: "#94a3b8", marginBottom: "0.25rem" }}>
              {t.totalGoals || "Total Goals"}
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{stats_summary.total_goals}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.875rem", color: "#94a3b8", marginBottom: "0.25rem" }}>
              {t.totalAssists || "Total Assists"}
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{stats_summary.total_assists}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.875rem", color: "#94a3b8", marginBottom: "0.25rem" }}>
              {t.totalMinutes || "Total Minutes"}
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
              {stats_summary.total_minutes_played}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.875rem", color: "#94a3b8", marginBottom: "0.25rem" }}>
              {t.avgGoalsPerMatch || "Avg Goals/Match"}
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
              {stats_summary.average_goals_per_match.toFixed(2)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.875rem", color: "#94a3b8", marginBottom: "0.25rem" }}>
              {t.avgAssistsPerMatch || "Avg Assists/Match"}
            </div>
            <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
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

