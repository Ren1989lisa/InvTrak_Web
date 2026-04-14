const DEFAULT_API_ORIGIN = "http://localhost:8085";

function normalizeApiBaseUrl(baseUrl) {
  const raw = (baseUrl ?? "").toString().trim().replace(/\/+$/, "");

  if (!raw) {
    return `${DEFAULT_API_ORIGIN}/api`;
  }

  if (/\/api$/i.test(raw)) {
    return raw;
  }

  return `${raw}/api`;
}

const API_BASE_URL = normalizeApiBaseUrl(
  import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    DEFAULT_API_ORIGIN
);

export class ApiError extends Error {
  constructor(message, status = 0, data = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function getToken() {
  try {
    return window.localStorage.getItem("invtrack_auth_token");
  } catch {
    return null;
  }
}

async function parseJsonSafe(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function apiRequest(
  endpoint,
  method = "GET",
  body = null,
  extraHeaders = {},
  requestOptions = {}
) {
  const { omitAuth = false } = requestOptions;
  const token = omitAuth ? null : getToken();
  const headers = {
    "Content-Type": "application/json",
    ...extraHeaders,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const fetchOptions = {
    method,
    headers,
  };

  if (body !== null && body !== undefined) {
    fetchOptions.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions);
  } catch {
    throw new ApiError("Error de conexión", 0, null);
  }

  const data = await parseJsonSafe(response);
  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      (response.status === 401 ? "Credenciales incorrectas" : "Error de conexión");
    throw new ApiError(message, response.status, data);
  }

  return data;
}

export { API_BASE_URL, normalizeApiBaseUrl };
