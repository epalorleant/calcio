import { memo } from "react";
import type { MatchTeam } from "../api/matches";
import type { Player } from "../api/players";
import type { SessionPlayer } from "../api/sessions";
import { commonStyles } from "../styles/common";
import { useTranslation } from "../i18n/useTranslation";

interface BenchStatsTableProps {
  players: SessionPlayer[];
  playerLookup: Player[];
  playerStats: Record<number, { goals: number; assists: number; minutes_played: number }>;
  benchTeams: Record<number, MatchTeam | null>;
  onTeamChange: (playerId: number, team: MatchTeam | null) => void;
  onStatChange: (playerId: number, field: "goals" | "assists" | "minutes_played", value: number) => void;
}

export const BenchStatsTable = memo(function BenchStatsTable({
  players,
  playerLookup,
  playerStats,
  benchTeams,
  onTeamChange,
  onStatChange,
}: BenchStatsTableProps) {
  const { t } = useTranslation();
  return (
    <div style={commonStyles.card}>
      <h3 style={commonStyles.smallHeading}>{t.bench}</h3>
      {players.length === 0 && <p style={commonStyles.muted}>{t.noBenchPlayers}</p>}
      {players.length > 0 && (
        <table style={commonStyles.table}>
          <thead>
            <tr>
              <th style={commonStyles.th}>{t.player}</th>
              <th style={commonStyles.th}>{t.playedFor}</th>
              <th style={commonStyles.th}>{t.goals}</th>
              <th style={commonStyles.th}>{t.assists}</th>
              <th style={commonStyles.th}>{t.minutes}</th>
            </tr>
          </thead>
          <tbody>
            {players.map((entry) => {
              const playerName = playerLookup.find((p) => p.id === entry.player_id)?.name || entry.player_id;
              const stats = playerStats[entry.player_id] ?? { goals: 0, assists: 0, minutes_played: 0 };
              const selectedTeam = benchTeams[entry.player_id] ?? "";
              return (
                <tr key={entry.player_id}>
                  <td style={commonStyles.td}>{playerName}</td>
                  <td style={commonStyles.td}>
                    <select
                      style={commonStyles.select}
                      value={selectedTeam}
                      onChange={(e) => {
                        const value = e.target.value as MatchTeam | "";
                        onTeamChange(entry.player_id, value === "" ? null : value);
                      }}
                    >
                      <option value="">{t.selectTeam}</option>
                      <option value="A">{t.teamA}</option>
                      <option value="B">{t.teamB}</option>
                    </select>
                  </td>
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

