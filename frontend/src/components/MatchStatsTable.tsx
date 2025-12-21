import { memo } from "react";
import type { Player } from "../api/players";
import type { SessionPlayer } from "../api/sessions";
import { commonStyles } from "../styles/common";
import { useTranslation } from "../i18n/useTranslation";

interface MatchStatsTableProps {
  title: string;
  players: SessionPlayer[];
  playerLookup: Player[];
  playerStats: Record<number, { goals: number; assists: number; minutes_played: number }>;
  onStatChange: (playerId: number, field: "goals" | "assists" | "minutes_played", value: number) => void;
  isAuthenticated: boolean;
}

export const MatchStatsTable = memo(function MatchStatsTable({
  title,
  players,
  playerLookup,
  playerStats,
  onStatChange,
  isAuthenticated,
}: MatchStatsTableProps) {
  const { t } = useTranslation();
  return (
    <div style={commonStyles.card}>
      <h3 style={commonStyles.smallHeading}>{title}</h3>
      {players.length === 0 && <p style={commonStyles.muted}>{t.assignPlayersToRecordStats}</p>}
      {players.length > 0 && (
        <table style={commonStyles.table}>
          <thead>
            <tr>
              <th style={commonStyles.th}>{t.player}</th>
              <th style={commonStyles.th}>{t.goals}</th>
              <th style={commonStyles.th}>{t.assists}</th>
              <th style={commonStyles.th}>{t.minutes}</th>
            </tr>
          </thead>
          <tbody>
            {players.map((entry) => {
              const playerName = playerLookup.find((p) => p.id === entry.player_id)?.name || entry.player_id;
              const stats = playerStats[entry.player_id] ?? { goals: 0, assists: 0, minutes_played: 0 };
              return (
                <tr key={entry.player_id}>
                  <td style={commonStyles.td}>{playerName}</td>
                  <td style={commonStyles.td}>
                    {isAuthenticated ? (
                      <input
                        type="number"
                        min={0}
                        style={commonStyles.input}
                        value={stats.goals}
                        onChange={(e) => onStatChange(entry.player_id, "goals", Number(e.target.value))}
                      />
                    ) : (
                      stats.goals
                    )}
                  </td>
                  <td style={commonStyles.td}>
                    {isAuthenticated ? (
                      <input
                        type="number"
                        min={0}
                        style={commonStyles.input}
                        value={stats.assists}
                        onChange={(e) => onStatChange(entry.player_id, "assists", Number(e.target.value))}
                      />
                    ) : (
                      stats.assists
                    )}
                  </td>
                  <td style={commonStyles.td}>
                    {isAuthenticated ? (
                      <input
                        type="number"
                        min={0}
                        style={commonStyles.input}
                        value={stats.minutes_played}
                        onChange={(e) => onStatChange(entry.player_id, "minutes_played", Number(e.target.value))}
                      />
                    ) : (
                      stats.minutes_played
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
});

