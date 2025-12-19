import client from "./client";
import type { Session } from "./sessions";

export type RecurrenceType = "NONE" | "WEEKLY" | "BIWEEKLY" | "MONTHLY";

export interface SessionTemplate {
  id: number;
  name: string;
  description: string | null;
  location: string;
  time_of_day: string; // HH:MM format
  day_of_week: number | null; // 0=Monday, 6=Sunday
  max_players: number;
  active: boolean;
  recurrence_type: RecurrenceType | null;
  recurrence_start: string | null; // ISO datetime string
  recurrence_end: string | null; // ISO datetime string
  last_generated: string | null; // ISO datetime string
  created_at: string;
  updated_at: string;
  session_count?: number;
}

export interface SessionTemplateCreate {
  name: string;
  description?: string | null;
  location: string;
  time_of_day: string; // HH:MM format
  day_of_week?: number | null; // 0-6, null for one-time
  max_players: number;
  recurrence_type?: RecurrenceType | null;
  recurrence_start?: string | null; // ISO datetime string
  recurrence_end?: string | null; // ISO datetime string
}

export interface SessionTemplateUpdate {
  name?: string;
  description?: string | null;
  location?: string;
  time_of_day?: string;
  day_of_week?: number | null;
  max_players?: number;
  active?: boolean;
  recurrence_type?: RecurrenceType | null;
  recurrence_start?: string | null;
  recurrence_end?: string | null;
}

export interface CreateSessionFromTemplatePayload {
  date: string; // ISO datetime string
  max_players?: number;
}

export async function getTemplates(active?: boolean): Promise<SessionTemplate[]> {
  const params = active !== undefined ? { active: String(active) } : {};
  const { data } = await client.get<SessionTemplate[]>("/session-templates", { params });
  return data;
}

export async function getTemplate(id: number): Promise<SessionTemplate> {
  const { data } = await client.get<SessionTemplate>(`/session-templates/${id}`);
  return data;
}

export async function createTemplate(payload: SessionTemplateCreate): Promise<SessionTemplate> {
  const { data } = await client.post<SessionTemplate>("/session-templates", payload);
  return data;
}

export async function updateTemplate(id: number, payload: SessionTemplateUpdate): Promise<SessionTemplate> {
  const { data } = await client.put<SessionTemplate>(`/session-templates/${id}`, payload);
  return data;
}

export async function deleteTemplate(id: number): Promise<void> {
  await client.delete(`/session-templates/${id}`);
}

export async function createSessionFromTemplate(
  templateId: number,
  payload: CreateSessionFromTemplatePayload,
): Promise<Session> {
  const { data } = await client.post<Session>(`/session-templates/${templateId}/create-session`, payload);
  return data;
}

export async function generateRecurringSessions(templateId: number): Promise<Session[]> {
  const { data } = await client.post<Session[]>(`/session-templates/${templateId}/generate-recurring`);
  return data;
}

