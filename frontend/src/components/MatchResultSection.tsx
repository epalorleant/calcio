import { memo } from "react";
import type { MatchTeam } from "../api/matches";
import type { Player } from "../api/players";
import type { SessionPlayer } from "../api/sessions";
import { BenchStatsTable } from "./BenchStatsTable";
import { MatchStatsTable } from "./MatchStatsTable";
import { commonStyles } from "../styles/common";
import { useTranslation } from "../i18n/useTranslation";

interface MatchResultSectionProps {
  matchForm: {
    scoreTeamA: number;
    scoreTeamB: number;
    notes: string;
  };
  onMatchFormChange: (form: { scoreTeamA: number; scoreTeamB: number; notes: string }) => void;
  teamAPlayers: SessionPlayer[];
  teamBPlayers: SessionPlayer[];
  benchPlayers: SessionPlayer[];
  players: Player[];
  playerStats: Record<number, { goals: number; assists: number; minutes_played: number }>;
  benchTeams: Record<number, MatchTeam | null>;
  onStatChange: (playerId: number, field: "goals" | "assists" | "minutes_played", value: number) => void;
  onBenchTeamChange: (playerId: number, team: MatchTeam | null) => void;
  onSaveMatch: () => Promise<void>;
  savingMatch: boolean;
  existingMatch: boolean;
  matchError: string | null;
  matchSuccess: string | null;
  isAuthenticated: boolean;
}

export const MatchResultSection = memo(function MatchResultSection({
  matchForm,
  onMatchFormChange,
  teamAPlayers,
  teamBPlayers,
  benchPlayers,
  players,
  playerStats,
  benchTeams,
  onStatChange,
  onBenchTeamChange,
  onSaveMatch,
  savingMatch,
  existingMatch,
  matchError,
  matchSuccess,
  isAuthenticated,
}: MatchResultSectionProps) {
  const { t } = useTranslation();
  return (
    <section style={commonStyles.section}>
      <h2 style={commonStyles.subheading}>{t.matchResult}</h2>
      {!isAuthenticated && (
        <p style={{ ...commonStyles.muted, marginBottom: "0.5rem", fontStyle: "italic" }}>
          {t.readOnlyMode}
        </p>
      )}
      {matchError && <p style={commonStyles.error}>{matchError}</p>}
      {matchSuccess && <p style={commonStyles.success}>{matchSuccess}</p>}
      {isAuthenticated && (
        <div style={commonStyles.scoreRow}>
        <label style={commonStyles.field}>
          <span style={commonStyles.label}>{t.scoreTeamA}</span>
          <input
            type="number"
            min={0}
            style={commonStyles.input}
            value={matchForm.scoreTeamA}
            onChange={(e) => onMatchFormChange({ ...matchForm, scoreTeamA: Number(e.target.value) || 0 })}
          />
        </label>
        <label style={commonStyles.field}>
          <span style={commonStyles.label}>{t.scoreTeamB}</span>
          <input
            type="number"
            min={0}
            style={commonStyles.input}
            value={matchForm.scoreTeamB}
            onChange={(e) => onMatchFormChange({ ...matchForm, scoreTeamB: Number(e.target.value) || 0 })}
          />
        </label>
        <label style={{ ...commonStyles.field, flex: 1 }}>
          <span style={commonStyles.label}>{t.notes}</span>
          <textarea
            style={commonStyles.textarea}
            rows={2}
            value={matchForm.notes}
            onChange={(e) => onMatchFormChange({ ...matchForm, notes: e.target.value })}
          />
        </label>
      </div>
      )}

      <div style={commonStyles.teamsGrid}>
        <MatchStatsTable
          title={t.teamA}
          players={teamAPlayers}
          playerLookup={players}
          playerStats={playerStats}
          onStatChange={onStatChange}
          isAuthenticated={isAuthenticated}
        />
        <MatchStatsTable
          title={t.teamB}
          players={teamBPlayers}
          playerLookup={players}
          playerStats={playerStats}
          onStatChange={onStatChange}
          isAuthenticated={isAuthenticated}
        />
      </div>

      <BenchStatsTable
        players={benchPlayers}
        playerLookup={players}
        playerStats={playerStats}
        benchTeams={benchTeams}
        onTeamChange={onBenchTeamChange}
        onStatChange={onStatChange}
        isAuthenticated={isAuthenticated}
      />

      {isAuthenticated && (
        <button style={{ ...commonStyles.button, marginTop: "0.75rem" }} onClick={() => void onSaveMatch()} disabled={savingMatch}>
          {savingMatch ? t.saving : existingMatch ? t.updateResult : t.saveMatch}
        </button>
      )}
    </section>
  );
});
