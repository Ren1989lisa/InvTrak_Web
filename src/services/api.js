import axios from "axios";

const DEFAULT_API_ORIGIN = "http://localhost:8085";
const TOKEN_KEYS = ["invtrack_auth_token", "token"];
const USER_KEY = "invtrack_auth_user";

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readStoredToken() {
  if (!isBrowser()) return null;

  for (const key of TOKEN_KEYS) {
    const value = window.localStorage.getItem(key);
    if (value && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function readStoredUser() {
  if (!isBrowser()) return null;

  try {
    const raw = window.localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStoredToken(token) {
  if (!isBrowser()) return;

  const trimmed = (token ?? "").toString().trim();
  if (!trimmed) return;

  window.localStorage.setItem("invtrack_auth_token", trimmed);
  window.localStorage.setItem("token", trimmed);
}

function writeStoredUser(user) {
  if (!isBrowser()) return;

  if (user === null || user === undefined) {
    window.localStorage.removeItem(USER_KEY);
    return;
  }

  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuthSession() {
  if (!isBrowser()) return;

  for (const key of TOKEN_KEYS) {
    window.localStorage.removeItem(key);
  }
  window.localStorage.removeItem(USER_KEY);
}

export function setAuthSession(token, user = null) {
  writeStoredToken(token);
  if (user !== null && user !== undefined) {
    writeStoredUser(user);
  }
}

export function getToken() {
  return readStoredToken();
}

export function getStoredUser() {
  return readStoredUser();
}

export function decodeJwtPayload(token) {
  try {
    const rawToken = (token ?? "").toString().trim();
    if (!rawToken) return null;

    const [, payloadBase64] = rawToken.split(".");
    if (!payloadBase64) return null;

    const base64 = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function isTokenExpired(token) {
  const payload = decodeJwtPayload(token);
  const exp = Number(payload?.exp);

  if (!Number.isFinite(exp)) {
    return false;
  }

  return Date.now() >= exp * 1000;
}

function normalizeBaseUrl(baseUrl) {
  const raw = (baseUrl ?? "").toString().trim().replace(/\/+$/, "");

  if (!raw) {
    return `${DEFAULT_API_ORIGIN}/api`;
  }

  if (/\/api$/i.test(raw)) {
    return raw;
  }

  return `${raw}/api`;
}

export function normalizeApiBaseUrl(baseUrl) {
  return normalizeBaseUrl(baseUrl);
}

const RAW_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  DEFAULT_API_ORIGIN;

export const API_BASE_URL = normalizeBaseUrl(RAW_BASE_URL);

export class ApiError extends Error {
  constructor(message, status = 0, data = null, cause = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    if (cause) {
      this.cause = cause;
    }
  }
}

function getAxiosErrorMessage(error) {
  const responseData = error?.response?.data ?? null;
  const status = error?.response?.status ?? 0;

  const backendMessage =
    responseData?.message ||
    responseData?.error ||
    responseData?.errors?.[0]?.defaultMessage ||
    responseData?.errors?.[0]?.message ||
    responseData?.fieldErrors?.[0]?.defaultMessage ||
    responseData?.fieldErrors?.[0]?.message;

  if (backendMessage) {
    return backendMessage;
  }

  if (error?.code === "ERR_CANCELED") {
    return "Solicitud cancelada";
  }

  if (error?.code === "ERR_NETWORK" || error?.message === "Network Error") {
    return "Error de red";
  }

  if (status === 401) {
    return "Sesion expirada";
  }

  if (status === 403) {
    return "Acceso denegado";
  }

  if (status === 404) {
    return "Recurso no encontrado";
  }

  return error?.message || "Error de conexion";
}

function shouldRedirectToLogin(config, status) {
  if (!isBrowser()) return false;
  if (config?.skipAuth || config?.skipAuthRedirect) return false;
  // Solo 401 debe cerrar sesión automáticamente (token vencido/no válido).
  // 403 significa falta de permisos para un recurso específico.
  if (status !== 401) return false;

  const path = window.location.pathname ?? "";
  if (path.startsWith("/login")) return false;

  return true;
}

function scheduleLoginRedirect() {
  if (!isBrowser()) return;

  window.setTimeout(() => {
    if ((window.location.pathname ?? "").startsWith("/login")) return;
    window.location.replace("/login");
  }, 0);
}

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const nextConfig = { ...config };
  nextConfig.headers = nextConfig.headers ?? {};

  if (!nextConfig.skipAuth) {
    const token = readStoredToken();
    if (token && !nextConfig.headers.Authorization) {
      nextConfig.headers.Authorization = `Bearer ${token}`;
    }
  }

  return nextConfig;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status ?? 0;
    const config = error?.config ?? {};
    const message = getAxiosErrorMessage(error);

    if (shouldRedirectToLogin(config, status)) {
      clearAuthSession();
      scheduleLoginRedirect();
    }

    throw new ApiError(message, status, error?.response?.data ?? null, error);
  }
);

export async function apiRequest(
  endpoint,
  method = "GET",
  body = null,
  extraHeaders = {},
  requestOptions = {}
) {
  const {
    omitAuth = false,
    params = undefined,
    responseType = "json",
    signal = undefined,
    skipAuthRedirect = false,
  } = requestOptions;

  const headers = { ...extraHeaders };
  const requestConfig = {
    url: endpoint,
    method,
    params,
    responseType,
    signal,
    skipAuth: omitAuth,
    skipAuthRedirect: omitAuth || skipAuthRedirect,
    headers,
  };

  if (body !== null && body !== undefined) {
    if (typeof FormData !== "undefined" && body instanceof FormData) {
      delete headers["Content-Type"];
      delete headers["content-type"];
    }

    requestConfig.data = body;
  }

  try {
    const response = await api.request(requestConfig);
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (axios.isAxiosError(error)) {
      const status = error?.response?.status ?? 0;
      const message = getAxiosErrorMessage(error);
      throw new ApiError(message, status, error?.response?.data ?? null, error);
    }

    throw new ApiError("Error de conexion", 0, null, error);
  }
}
