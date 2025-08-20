export const BASE_URL = `${window.location.protocol}//${window.location.hostname}:8000`;

console.log(`🔗 API Base URL: ${BASE_URL}`);

export const getToken = () => localStorage.getItem("token");
