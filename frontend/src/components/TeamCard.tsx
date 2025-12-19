import { memo } from "react";
import type { BalancedTeamsResponse } from "../api/sessions";
import { commonStyles } from "../styles/common";

interface TeamCardProps {
  title: string;
  players: BalancedTeamsResponse["team_a"];
}

export const TeamCard = memo(function TeamCard({ title, players }: TeamCardProps) {
  return (
    <div style={commonStyles.card}>
      <h3 style={commonStyles.smallHeading}>{title}</h3>
      {players.length === 0 && <p>None</p>}
      {players.length > 0 && (
        <ul style={commonStyles.list}>
          {players.map((p) => (
            <li key={p.player_id} style={commonStyles.listItem}>
              <span>{p.name}</span>
              <span style={commonStyles.muted}>
                ({p.rating.toFixed(1)}){p.is_goalkeeper ? " GK" : ""}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

