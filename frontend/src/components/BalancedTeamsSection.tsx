import { memo } from "react";
import type { BalancedTeamsResponse } from "../api/sessions";
import { TeamCard } from "./TeamCard";
import { commonStyles } from "../styles/common";
import { useTranslation } from "../i18n/useTranslation";

interface BalancedTeamsSectionProps {
  balanced: BalancedTeamsResponse | null;
  hasExistingTeams: boolean;
  canGenerateTeams: boolean;
  onGenerate: () => Promise<void>;
  isAuthenticated: boolean;
}

export const BalancedTeamsSection = memo(function BalancedTeamsSection({
  balanced,
  hasExistingTeams,
  canGenerateTeams,
  onGenerate,
  isAuthenticated,
}: BalancedTeamsSectionProps) {
  const { t } = useTranslation();
  return (
    <section style={commonStyles.section}>
      <div style={commonStyles.sectionHeader}>
        <h2 style={commonStyles.subheading}>{t.balancedTeams}</h2>
        {isAuthenticated && (
          <button
            style={{
              ...commonStyles.button,
              opacity: hasExistingTeams || !canGenerateTeams ? 0.6 : 1,
              cursor: hasExistingTeams || !canGenerateTeams ? "not-allowed" : "pointer",
            }}
            onClick={() => void onGenerate()}
            disabled={hasExistingTeams || !canGenerateTeams}
            title={
              !canGenerateTeams ? "Au moins 10 joueurs disponibles requis" : hasExistingTeams ? "Équipes déjà assignées" : undefined
            }
          >
            {t.generateBalancedTeams}
          </button>
        )}
      </div>
      {balanced ? (
        <div style={commonStyles.teamsGrid}>
          <TeamCard title={t.teamA} players={balanced.team_a} />
          <TeamCard title={t.teamB} players={balanced.team_b} />
          <TeamCard title={t.bench} players={balanced.bench} />
        </div>
      ) : (
        <p>{t.noTeamAssignments}</p>
      )}
      {balanced && <p>{t.balanceScore}: {balanced.balance_score.toFixed(2)}</p>}
    </section>
  );
});

