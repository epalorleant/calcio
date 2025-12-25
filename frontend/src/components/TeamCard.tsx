import { memo, useState, useRef, useEffect } from "react";
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
  availableTeams?: Array<{ type: SessionTeam | "BENCH"; label: string }>;
}

export const TeamCard = memo(function TeamCard({
  title,
  players,
  teamType,
  onPlayerDrop,
  isDraggable = false,
  isDropTarget = false,
  availableTeams,
}: TeamCardProps) {
  const { t } = useTranslation();
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [touchStartPos, setTouchStartPos] = useState<{ x: number; y: number } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const isMobile = typeof window !== "undefined" && window.innerWidth <= 768;

  // Handle desktop drag and drop
  const handleDragStart = (e: React.DragEvent, playerId: number) => {
    if (!isDraggable || isMobile) return;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("playerId", String(playerId));
    e.dataTransfer.setData("sourceTeam", teamType);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!isDropTarget || isMobile) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!isDropTarget || !onPlayerDrop || isMobile) return;
    e.preventDefault();
    const playerId = Number(e.dataTransfer.getData("playerId"));
    const sourceTeam = e.dataTransfer.getData("sourceTeam");
    
    // Don't do anything if dropping on the same team
    if (sourceTeam === teamType) return;
    
    // Convert "BENCH" to null for the API
    const targetTeam = teamType === "BENCH" ? null : (teamType as SessionTeam);
    onPlayerDrop(playerId, targetTeam);
  };

  // Handle mobile touch events
  const handleTouchStart = (e: React.TouchEvent, playerId: number) => {
    if (!isDraggable || !isMobile) return;
    const touch = e.touches[0];
    setTouchStartPos({ x: touch.clientX, y: touch.clientY });
    setSelectedPlayerId(playerId);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPos || !isMobile) return;
    // Prevent scrolling while dragging
    e.preventDefault();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartPos || !isMobile || !onPlayerDrop || !selectedPlayerId) {
      setTouchStartPos(null);
      setSelectedPlayerId(null);
      return;
    }

    const touch = e.changedTouches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    
    // Find the team card that was touched
    const targetCard = element?.closest('[data-team-card]');
    if (targetCard) {
      const targetTeamType = targetCard.getAttribute('data-team-type');
      if (targetTeamType && targetTeamType !== teamType) {
        const targetTeam = targetTeamType === "BENCH" ? null : (targetTeamType as SessionTeam);
        onPlayerDrop(selectedPlayerId, targetTeam);
      }
    }
    
    setTouchStartPos(null);
    setSelectedPlayerId(null);
  };

  // Handle click/tap to show team selection menu on mobile
  const handlePlayerClick = (e: React.MouseEvent, playerId: number) => {
    if (!isDraggable || !isMobile) return;
    e.preventDefault();
    e.stopPropagation();
    setSelectedPlayerId(selectedPlayerId === playerId ? null : playerId);
  };

  const handleTeamSelect = (targetTeam: SessionTeam | null) => {
    if (!selectedPlayerId || !onPlayerDrop) return;
    onPlayerDrop(selectedPlayerId, targetTeam);
    setSelectedPlayerId(null);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setSelectedPlayerId(null);
      }
    };

    if (selectedPlayerId && isMobile) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [selectedPlayerId, isMobile]);

  return (
    <div
      ref={cardRef}
      data-team-card
      data-team-type={teamType}
      style={{
        ...commonStyles.card,
        ...(isDropTarget && !isMobile
          ? {
              border: "2px dashed #2563eb",
              backgroundColor: "#eff6ff",
            }
          : {}),
        position: "relative",
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
                      cursor: isMobile ? "pointer" : "grab",
                      userSelect: "none",
                      position: "relative",
                      padding: "0.5rem",
                      borderRadius: "4px",
                      backgroundColor: selectedPlayerId === p.player_id ? "#eff6ff" : "transparent",
                    }
                  : {}),
              }}
              draggable={isDraggable && !isMobile}
              onDragStart={(e) => handleDragStart(e, p.player_id)}
              onTouchStart={(e) => handleTouchStart(e, p.player_id)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onClick={(e) => handlePlayerClick(e, p.player_id)}
            >
              <span>{p.name}</span>
              <span style={commonStyles.muted}>
                ({p.rating.toFixed(1)}){p.is_goalkeeper ? " GK" : ""}
              </span>
              {isMobile && isDraggable && selectedPlayerId === p.player_id && availableTeams && (
                <div
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    marginTop: "0.25rem",
                    backgroundColor: "#fff",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                    zIndex: 1000,
                    padding: "0.5rem",
                  }}
                >
                  <div style={{ fontSize: "0.875rem", marginBottom: "0.5rem", fontWeight: "600" }}>
                    {t.moveTo || "Move to"}:
                  </div>
                  {availableTeams
                    .filter((team) => team.type !== teamType)
                    .map((team) => (
                      <button
                        key={team.type}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const targetTeam = team.type === "BENCH" ? null : (team.type as SessionTeam);
                          handleTeamSelect(targetTeam);
                        }}
                        style={{
                          width: "100%",
                          padding: "0.5rem",
                          marginBottom: "0.25rem",
                          backgroundColor: "#2563eb",
                          color: "#fff",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "0.875rem",
                          textAlign: "left",
                        }}
                      >
                        {team.label}
                      </button>
                    ))}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedPlayerId(null);
                    }}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      backgroundColor: "#6b7280",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "0.875rem",
                    }}
                  >
                    {t.cancel || "Cancel"}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

