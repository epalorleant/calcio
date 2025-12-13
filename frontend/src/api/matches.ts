import axios from "axios";
import client from "./client";
import type { SessionTeam } from "./sessions";

type MatchTeam = "A" | "B";

export interface PlayerStatsLine {
  id: number;
  match_id: number;
  player_id: number;
  team: MatchTeam;
  goals: number;
  assists: number;
  minutes_played: number;
  rating_after_match: number | null;
}

export interface MatchWithStats {
  id: number;
  session_id: number;
  score_team_a: number;
  score_team_b: number;
  notes: string | null;
  stats: PlayerStatsLine[];
}

export interface PlayerStatInput {
  player_id: number;
  team: MatchTeam;
  goals: number;
  assists: number;
  minutes_played: number;
}

export interface MatchCreatePayload {
  session_id: number;
  score_team_a: number;
  score_team_b: number;
  notes?: string;
  player_stats: PlayerStatInput[];
}

export async function createMatch(payload: MatchCreatePayload): Promise<MatchWithStats> {
  const { data } = await client.post<MatchWithStats>("/matches", payload);
  return data;
}

export async function getMatchForSession(sessionId: number): Promise<MatchWithStats | null> {
  try {
    const { data } = await client.get<MatchWithStats>(`/sessions/${sessionId}/match`);
    return data;
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 404) {
      return null;
    }
    throw err;
  }
}

export function sessionTeamToMatchTeam(team: SessionTeam | null): MatchTeam | null {
  if (team === "A" || team === "B") return team;
  return null;
}
