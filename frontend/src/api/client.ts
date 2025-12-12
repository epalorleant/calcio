import axios, { type AxiosError, type AxiosResponse } from "axios";

const client = axios.create({
  // Prefer runtime config (injected via config.js), then build-time env, then same-origin proxy.
  baseURL:
    (typeof window !== "undefined" ? window.__APP_CONFIG__?.apiUrl : undefined) ??
    import.meta.env.VITE_API_URL ??
    "/api",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

client.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    // Basic logging to help during development.
    console.error("API error:", error);
    return Promise.reject(error);
  },
);

export default client;
