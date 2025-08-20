import { BASE_URL, getToken } from './config';

export const fetchWithAuth = async (endpoint, method = 'GET', body = null) => {
  const token = getToken();
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  };

  if (method !== 'GET' && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (process.env.NODE_ENV === 'development') {
    console.log("🔐 fetchWithAuth request:", {
      url: `${BASE_URL}${endpoint}`,
      method,
      body,
    });
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : null,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    if (process.env.NODE_ENV === 'development') {
      console.error("❌ fetchWithAuth failed:", response.status, errorData);
    }
    throw new Error(errorData.detail || `API call failed: ${response.status}`);
  }

  return await response.json();
};
