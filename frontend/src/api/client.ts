import axios, { type AxiosError, type AxiosResponse } from "axios";
import { getStoredToken, clearTokens, refreshAccessToken } from "./auth";

const client = axios.create({
  // Prefer runtime config (injected via config.js), then build-time env, then same-origin root.
  baseURL:
    (typeof window !== "undefined" ? window.__APP_CONFIG__?.apiUrl : undefined) ??
    import.meta.env.VITE_API_URL ??
    window?.location?.origin ??
    "/",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor: Add JWT token to requests
client.interceptors.request.use(
  (config) => {
    const token = getStoredToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle 401 errors and token refresh
client.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // If 401 and we haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Don't try to refresh if we're already on login/register page
      const isAuthPage = window.location.pathname === "/login" || window.location.pathname === "/register";
      
      // Only try to refresh if we have a refresh token
      const refreshToken = getStoredRefreshToken();
      if (!refreshToken || isAuthPage) {
        clearTokens();
        return Promise.reject(error);
      }

      try {
        // Try to refresh the token
        await refreshAccessToken();
        // Retry the original request with new token
        const token = getStoredToken();
        if (token) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
        }
        return client(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens
        clearTokens();
        // Only redirect if not already on login page
        if (!isAuthPage) {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }

    // Basic logging to help during development.
    console.error("API error:", error);
    return Promise.reject(error);
  }
);

export default client;
