import { memo } from "react";
import type { BalancedTeamsResponse, SessionTeam } from "../api/sessions";
import { TeamCard } from "./TeamCard";
import { commonStyles } from "../styles/common";
import { useTranslation } from "../i18n/useTranslation";

interface BalancedTeamsSectionProps {
  balanced: BalancedTeamsResponse | null;
  hasExistingTeams: boolean;
  canGenerateTeams: boolean;
  onGenerate: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin?: boolean;
  onPlayerTeamChange?: (playerId: number, newTeam: SessionTeam | null) => Promise<void>;
  matchInitiated?: boolean;
}

export const BalancedTeamsSection = memo(function BalancedTeamsSection({
  balanced,
  hasExistingTeams,
  canGenerateTeams,
  onGenerate,
  isAuthenticated,
  isAdmin = false,
  onPlayerTeamChange,
  matchInitiated = false,
}: BalancedTeamsSectionProps) {
  const { t } = useTranslation();
  const canDragAndDrop = isAdmin && balanced !== null && onPlayerTeamChange !== undefined && !matchInitiated;

  return (
    <section style={commonStyles.section}>
      <div style={commonStyles.sectionHeader}>
        <h2 style={commonStyles.subheading}>{t.balancedTeams}</h2>
        {isAuthenticated && (
          <button
            style={{
              ...commonStyles.button,
              opacity: hasExistingTeams || !canGenerateTeams || matchInitiated ? 0.6 : 1,
              cursor: hasExistingTeams || !canGenerateTeams || matchInitiated ? "not-allowed" : "pointer",
            }}
            onClick={() => void onGenerate()}
            disabled={hasExistingTeams || !canGenerateTeams || matchInitiated}
            title={
              matchInitiated
                ? t.cannotModifyTeamsAfterMatchInitiated || "Cannot modify teams after match has been initiated"
                : !canGenerateTeams
                ? "Au moins 10 joueurs disponibles requis"
                : hasExistingTeams
                ? "Équipes déjà assignées"
                : undefined
            }
          >
            {t.generateBalancedTeams}
          </button>
        )}
      </div>
      {canDragAndDrop && (
        <p style={{ ...commonStyles.muted, marginBottom: "0.5rem", fontSize: "0.875rem" }}>
          {t.dragAndDropHint || "Drag players between teams to reorganize"}
        </p>
      )}
      {balanced ? (
        <div style={commonStyles.teamsGrid}>
          <TeamCard
            title={t.teamA}
            players={balanced.team_a}
            teamType="A"
            onPlayerDrop={onPlayerTeamChange}
            isDraggable={canDragAndDrop}
            isDropTarget={canDragAndDrop}
          />
          <TeamCard
            title={t.teamB}
            players={balanced.team_b}
            teamType="B"
            onPlayerDrop={onPlayerTeamChange}
            isDraggable={canDragAndDrop}
            isDropTarget={canDragAndDrop}
          />
          <TeamCard
            title={t.bench}
            players={balanced.bench}
            teamType="BENCH"
            onPlayerDrop={onPlayerTeamChange}
            isDraggable={canDragAndDrop}
            isDropTarget={canDragAndDrop}
          />
        </div>
      ) : (
        <p>{t.noTeamAssignments}</p>
      )}
      {balanced && <p>{t.balanceScore}: {balanced.balance_score.toFixed(2)}</p>}
    </section>
  );
});

