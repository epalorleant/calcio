import { memo } from "react";
import type { BalancedTeamsResponse, SessionTeam } from "../api/sessions";
import { commonStyles } from "../styles/common";
import { useTranslation } from "../i18n/useTranslation";

interface TeamCardProps {
  title: string;
  players: BalancedTeamsResponse["team_a"];
  teamType: SessionTeam | "BENCH";
  onPlayerDrop?: (playerId: number, targetTeam: SessionTeam | null) => void;
  isDraggable?: boolean;
  isDropTarget?: boolean;
}

export const TeamCard = memo(function TeamCard({
  title,
  players,
  teamType,
  onPlayerDrop,
  isDraggable = false,
  isDropTarget = false,
}: TeamCardProps) {
  const { t } = useTranslation();

  const handleDragStart = (e: React.DragEvent, playerId: number) => {
    if (!isDraggable) return;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("playerId", String(playerId));
    e.dataTransfer.setData("sourceTeam", teamType);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!isDropTarget) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!isDropTarget || !onPlayerDrop) return;
    e.preventDefault();
    const playerId = Number(e.dataTransfer.getData("playerId"));
    const sourceTeam = e.dataTransfer.getData("sourceTeam");
    
    // Don't do anything if dropping on the same team
    if (sourceTeam === teamType) return;
    
    // Convert "BENCH" to null for the API
    const targetTeam = teamType === "BENCH" ? null : (teamType as SessionTeam);
    onPlayerDrop(playerId, targetTeam);
  };

  return (
    <div
      style={{
        ...commonStyles.card,
        ...(isDropTarget
          ? {
              border: "2px dashed #2563eb",
              backgroundColor: "#eff6ff",
            }
          : {}),
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <h3 style={commonStyles.smallHeading}>{title}</h3>
      {players.length === 0 && <p>{t.none}</p>}
      {players.length > 0 && (
        <ul style={commonStyles.list}>
          {players.map((p) => (
            <li
              key={p.player_id}
              style={{
                ...commonStyles.listItem,
                ...(isDraggable
                  ? {
                      cursor: "grab",
                      userSelect: "none",
                    }
                  : {}),
              }}
              draggable={isDraggable}
              onDragStart={(e) => handleDragStart(e, p.player_id)}
            >
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

