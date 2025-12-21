import client from "./client";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  player_id?: number;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  is_active: boolean;
  is_admin: boolean;
  is_root: boolean;
  player_id: number | null;
}

export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
}

export interface GrantAdminRequest {
  user_id: number;
}

const TOKEN_STORAGE_KEY = "calcio_access_token";
const REFRESH_TOKEN_STORAGE_KEY = "calcio_refresh_token";

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function getStoredRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
}

export function storeTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
}

export async function login(credentials: LoginRequest): Promise<TokenResponse> {
  const response = await client.post<TokenResponse>("/auth/login", credentials);
  const { access_token, refresh_token } = response.data;
  storeTokens(access_token, refresh_token);
  return response.data;
}

export async function register(userData: RegisterRequest): Promise<TokenResponse> {
  const response = await client.post<TokenResponse>("/auth/register", userData);
  const { access_token, refresh_token } = response.data;
  storeTokens(access_token, refresh_token);
  return response.data;
}

export async function getCurrentUser(): Promise<User> {
  const response = await client.get<User>("/auth/me");
  return response.data;
}

export async function refreshAccessToken(): Promise<TokenResponse> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }
  // Use axios directly to avoid interceptor recursion
  const axios = await import("axios");
  const response = await axios.default.post<TokenResponse>(
    `${client.defaults.baseURL}/auth/refresh`,
    { refresh_token: refreshToken },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
  const { access_token, refresh_token } = response.data;
  storeTokens(access_token, refresh_token);
  return response.data;
}

export async function changePassword(request: PasswordChangeRequest): Promise<void> {
  await client.post("/auth/change-password", request);
}

export async function getUsers(): Promise<User[]> {
  const { data } = await client.get<User[]>("/auth/users");
  return data;
}

export async function grantAdminRole(request: GrantAdminRequest): Promise<void> {
  await client.post("/auth/grant-admin", request);
}

