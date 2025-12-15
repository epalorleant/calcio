import axios from "axios";
import client from "./client";
import type { SessionPlayer, SessionTeam } from "./sessions";

export type MatchTeam = "A" | "B";

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

export interface SessionMatch extends MatchWithStats {
  team_a_players: SessionPlayer[];
  team_b_players: SessionPlayer[];
  bench_players: SessionPlayer[];
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

export async function createMatch(payload: MatchCreatePayload): Promise<SessionMatch> {
  const { data } = await client.post<SessionMatch>("/matches", payload);
  return data;
}

export async function updateMatch(matchId: number, payload: MatchCreatePayload): Promise<SessionMatch> {
  const { data } = await client.put<SessionMatch>(`/matches/${matchId}`, payload);
  return data;
}

export async function getMatchForSession(sessionId: number): Promise<SessionMatch | null> {
  try {
    const { data } = await client.get<SessionMatch>(`/sessions/${sessionId}/match`);
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
