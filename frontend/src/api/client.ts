import axios, { type AxiosError, type AxiosResponse } from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000",
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
