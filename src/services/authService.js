import { apiRequest } from "../api/apiClient";

const TOKEN_KEY = "invtrack_auth_token";
const USER_KEY = "invtrack_auth_user";

function decodeJwtPayload(token) {
  try {
    const [, payloadBase64] = token.split(".");
    if (!payloadBase64) return null;
    const base64 = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

function mapRole(rawRole) {
  const roleValue = Array.isArray(rawRole) ? rawRole[0] : rawRole;
  const normalized = (roleValue ?? "").toString().trim().toUpperCase();

  if (normalized === "ROLE_ADMINISTRADOR") return "admin";
  if (normalized === "ROLE_TECNICO") return "tecnico";
  if (normalized === "ROLE_USUARIO") return "usuario";
  return "usuario";
}

function normalizeUser(usuario = {}, token = null) {
  const payload = token ? decodeJwtPayload(token) : null;
  const backendRole =
    usuario?.rol ??
    usuario?.role ??
    usuario?.authorities ??
    payload?.rol ??
    payload?.role ??
    payload?.authorities;

  const rol = mapRole(backendRole);

  return {
    ...usuario,
    id_usuario: usuario?.id_usuario ?? usuario?.id ?? payload?.id ?? null,
    nombre: usuario?.nombre ?? usuario?.nombre_completo ?? payload?.name ?? "",
    nombre_completo: usuario?.nombre_completo ?? usuario?.nombre ?? payload?.name ?? "",
    correo: usuario?.correo ?? usuario?.email ?? payload?.sub ?? "",
    rol,
  };
}

function setStoredToken(token) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

function setStoredUser(user) {
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearAuthStorage() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export function getToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getCurrentUser() {
  const token = getToken();
  if (!token) return null;

  const payload = decodeJwtPayload(token);
  const exp = Number(payload?.exp);
  if (Number.isFinite(exp) && Date.now() >= exp * 1000) {
    clearAuthStorage();
    return null;
  }

  let parsedUser = null;
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    parsedUser = raw ? JSON.parse(raw) : null;
  } catch {
    parsedUser = null;
  }

  return normalizeUser(parsedUser ?? {}, token);
}

export async function login(correo, password) {
  const data = await apiRequest(
    "/auth/login",
    "POST",
    { correo, password },
    {},
    { omitAuth: true }
  );
  const token = data?.token;
  const usuario = data?.usuario;

  if (!token) {
    throw new Error("Respuesta inválida del servidor");
  }

  const user = normalizeUser(usuario ?? {}, token);
  setStoredToken(token);
  setStoredUser(user);
  return user;
}

export function logout() {
  clearAuthStorage();
}
