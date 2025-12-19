import { memo } from "react";
import type { Player } from "../api/players";
import type { SessionPlayer } from "../api/sessions";
import { commonStyles } from "../styles/common";

interface MatchStatsTableProps {
  title: string;
  players: SessionPlayer[];
  playerLookup: Player[];
  playerStats: Record<number, { goals: number; assists: number; minutes_played: number }>;
  onStatChange: (playerId: number, field: "goals" | "assists" | "minutes_played", value: number) => void;
}

export const MatchStatsTable = memo(function MatchStatsTable({
  title,
  players,
  playerLookup,
  playerStats,
  onStatChange,
}: MatchStatsTableProps) {
  return (
    <div style={commonStyles.card}>
      <h3 style={commonStyles.smallHeading}>{title}</h3>
      {players.length === 0 && <p style={commonStyles.muted}>Assign players to this team to record stats.</p>}
      {players.length > 0 && (
        <table style={commonStyles.table}>
          <thead>
            <tr>
              <th style={commonStyles.th}>Player</th>
              <th style={commonStyles.th}>Goals</th>
              <th style={commonStyles.th}>Assists</th>
              <th style={commonStyles.th}>Minutes</th>
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
                    <input
                      type="number"
                      min={0}
                      style={commonStyles.input}
                      value={stats.goals}
                      onChange={(e) => onStatChange(entry.player_id, "goals", Number(e.target.value))}
                    />
                  </td>
                  <td style={commonStyles.td}>
                    <input
                      type="number"
                      min={0}
                      style={commonStyles.input}
                      value={stats.assists}
                      onChange={(e) => onStatChange(entry.player_id, "assists", Number(e.target.value))}
                    />
                  </td>
                  <td style={commonStyles.td}>
                    <input
                      type="number"
                      min={0}
                      style={commonStyles.input}
                      value={stats.minutes_played}
                      onChange={(e) => onStatChange(entry.player_id, "minutes_played", Number(e.target.value))}
                    />
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

