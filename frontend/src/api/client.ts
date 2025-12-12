import axios from "axios";

const client = axios.create({
  baseURL: "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    // Basic logging to help during development.
    console.error("API error:", error);
    return Promise.reject(error);
  },
);

export default client;
