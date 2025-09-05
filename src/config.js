// Set your real endpoint here (or leave "mock" while testing).
// You can also override via query string: ?url=https://api.example.com/flights?airport=PSM
const params = new URLSearchParams(window.location.search);
export const FLIGHTS_URL = params.get("url") || "mock";
export const REFRESH_MS = Number(params.get("refresh_ms") || 10000);

// Optional: auth headers if your API needs them (Bearer/API key/etc.)
export const API_HEADERS = {
  // Example:
  // Authorization: `Bearer ${params.get("token") || "YOUR_TOKEN_HERE"}`
};