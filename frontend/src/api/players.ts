import client from "./client";

export type Player = {
  id: number;
  name: string;
  preferred_position?: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type PlayerCreate = {
  name: string;
  preferred_position?: string | null;
  active?: boolean;
};

export async function getPlayers(): Promise<Player[]> {
  const { data } = await client.get<Player[]>("/players");
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
