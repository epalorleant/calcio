import client from "./client";

export type Player = {
  id: number;
  name: string;
  preferred_position?: string | null;
  active: boolean;
  rating?: {
    overall_rating: number;
    last_updated_at: string;
  } | null;
  created_at: string;
  updated_at: string;
};

export type PlayerCreate = {
  name: string;
  preferred_position?: string | null;
  active?: boolean;
};

export async function getPlayers(active?: boolean): Promise<Player[]> {
  const params = active !== undefined ? { active } : {};
  const { data } = await client.get<Player[]>("/players", { params });
  return data;
}

export async function getPlayer(id: number): Promise<Player> {
  const { data } = await client.get<Player>(`/players/${id}`);
  return data;
}

export interface PlayerStatsSummary {
  total_matches: number;
  total_goals: number;
  total_assists: number;
  total_minutes_played: number;
  average_goals_per_match: number;
  average_assists_per_match: number;
}

export interface PlayerMatchHistoryItem {
  match_id: number;
  session_id: number;
  session_date: string;
  session_location: string;
  team: "A" | "B";
  goals: number;
  assists: number;
  minutes_played: number;
  score_team_a: number;
  score_team_b: number;
  rating_after_match: number | null;
}

export interface PlayerProfile {
  player: Player;
  stats_summary: PlayerStatsSummary;
  match_history: PlayerMatchHistoryItem[];
}

export async function getPlayerProfile(id: number): Promise<PlayerProfile> {
  const { data } = await client.get<PlayerProfile>(`/players/${id}/profile`);
  return data;
}

export async function createPlayer(payload: PlayerCreate): Promise<Player> {
  const { data } = await client.post<Player>("/players", payload);
  return data;
}

export async function updatePlayer(id: number, payload: PlayerCreate): Promise<Player> {
  const { data } = await client.put<Player>(`/players/${id}`, payload);
  return data;
}

export async function deletePlayer(id: number): Promise<Player> {
  const { data } = await client.delete<Player>(`/players/${id}`);
  return data;
}
