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

  // ✅ Don’t force `/api` if endpoint already starts with `/api`
  const url = endpoint.startsWith('/api')
    ? `${BASE_URL}${endpoint}`
    : `${BASE_URL}${endpoint}`;

  if (process.env.NODE_ENV === 'development') {
    console.log("🔐 fetchWithAuth request:", { url, method, body });
  }

  const response = await fetch(url, {
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
