import axios, { type AxiosError, type AxiosResponse } from "axios";

const client = axios.create({
  // Prefer injected env; otherwise default to same-origin /api proxy.
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
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
