import { memo } from "react";
import type { BalancedTeamsResponse } from "../api/sessions";
import { TeamCard } from "./TeamCard";
import { commonStyles } from "../styles/common";

interface BalancedTeamsSectionProps {
  balanced: BalancedTeamsResponse | null;
  hasExistingTeams: boolean;
  canGenerateTeams: boolean;
  onGenerate: () => Promise<void>;
}

export const BalancedTeamsSection = memo(function BalancedTeamsSection({
  balanced,
  hasExistingTeams,
  canGenerateTeams,
  onGenerate,
}: BalancedTeamsSectionProps) {
  return (
    <section style={commonStyles.section}>
      <div style={commonStyles.sectionHeader}>
        <h2 style={commonStyles.subheading}>Balanced Teams</h2>
        <button
          style={{
            ...commonStyles.button,
            opacity: hasExistingTeams || !canGenerateTeams ? 0.6 : 1,
            cursor: hasExistingTeams || !canGenerateTeams ? "not-allowed" : "pointer",
          }}
          onClick={() => void onGenerate()}
          disabled={hasExistingTeams || !canGenerateTeams}
          title={
            !canGenerateTeams ? "Need at least 10 available players" : hasExistingTeams ? "Teams already assigned" : undefined
          }
        >
          Generate balanced teams
        </button>
      </div>
      {balanced ? (
        <div style={commonStyles.teamsGrid}>
          <TeamCard title="Team A" players={balanced.team_a} />
          <TeamCard title="Team B" players={balanced.team_b} />
          <TeamCard title="Bench" players={balanced.bench} />
        </div>
      ) : (
        <p>No teams generated yet.</p>
      )}
      {balanced && <p>Balance score: {balanced.balance_score.toFixed(2)}</p>}
    </section>
  );
});

