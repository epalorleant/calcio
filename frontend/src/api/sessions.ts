import client from "./client";

export type SessionStatus = "PLANNED" | "COMPLETED" | "CANCELLED";
export type Availability = "YES" | "NO" | "MAYBE";
export type SessionTeam = "A" | "B" | "BENCH";

export interface Session {
  id: number;
  date: string;
  location: string;
  max_players: number;
  status: SessionStatus;
  created_at: string;
  updated_at: string;
}

export interface SessionCreate {
  date: string;
  location: string;
  max_players: number;
  status?: SessionStatus;
}

export interface SessionPlayer {
  id: number;
  session_id: number;
  player_id: number;
  availability: Availability;
  team: SessionTeam | null;
  is_goalkeeper: boolean;
}

export interface AvailabilityPayload {
  player_id: number;
  availability: Availability;
  is_goalkeeper?: boolean;
}

export interface AvailabilityBatchPayload {
  entries: AvailabilityPayload[];
}

export interface BalancedPlayer {
  player_id: number;
  name: string;
  rating: number;
  is_goalkeeper: boolean;
}

export interface BalancedTeamsResponse {
  team_a: BalancedPlayer[];
  team_b: BalancedPlayer[];
  bench: BalancedPlayer[];
  balance_score: number;
}

export async function getSessions(): Promise<Session[]> {
  const { data } = await client.get<Session[]>("/sessions");
  return data;
}

export async function createSession(payload: SessionCreate): Promise<Session> {
  const { data } = await client.post<Session>("/sessions", payload);
  return data;
}

export async function getSession(id: number): Promise<Session> {
  const { data } = await client.get<Session>(`/sessions/${id}`);
  return data;
}

export async function getAvailability(sessionId: number): Promise<SessionPlayer[]> {
  const { data } = await client.get<SessionPlayer[]>(`/sessions/${sessionId}/availability`);
  return data;
}

export async function setAvailability(sessionId: number, payload: AvailabilityPayload): Promise<SessionPlayer> {
  const { data } = await client.post<SessionPlayer>(`/sessions/${sessionId}/availability`, payload);
  return data;
}

export async function setAvailabilityBatch(
  sessionId: number,
  payload: AvailabilityBatchPayload,
): Promise<SessionPlayer[]> {
  const { data } = await client.post<SessionPlayer[]>(`/sessions/${sessionId}/availability/batch`, payload);
  return data;
}

export async function generateBalancedTeams(sessionId: number): Promise<BalancedTeamsResponse> {
  const { data } = await client.post<BalancedTeamsResponse>(`/sessions/${sessionId}/balanced-teams`);
  return data;
}

export async function deleteSession(id: number): Promise<void> {
  await client.delete<void>(`/sessions/${id}`);
}
