let BASE_URL;

if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
  // Local development → FastAPI default port
  BASE_URL = "http://localhost:8000";
} else {
  // Production (Render) → no :8000, just the backend domain
  BASE_URL = `${window.location.protocol}//${window.location.hostname}`;
}

export { BASE_URL };

export const getToken = () => localStorage.getItem("token");
