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
  const roleCandidates = Array.isArray(rawRole) ? rawRole : [rawRole];
  const normalizedRoles = roleCandidates
    .map((r) => (r ?? "").toString().trim().toUpperCase())
    .filter(Boolean);

  if (normalizedRoles.includes("ROLE_ADMINISTRADOR")) return "admin";
  if (normalizedRoles.includes("ROLE_TECNICO")) return "tecnico";
  if (normalizedRoles.includes("ROLE_USUARIO")) return "usuario";
  return "usuario";
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    const asString = String(value).trim();
    if (asString) return asString;
  }
  return "";
}

function normalizeUser(usuario = {}, token = null) {
  const payload = token ? decodeJwtPayload(token) : null;
  const backendRole =
    usuario?.rol ??
    usuario?.role ??
    usuario?.roles ??
    usuario?.authorities ??
    payload?.rol ??
    payload?.role ??
    payload?.roles ??
    payload?.authorities;

  const rol = mapRole(backendRole);
  const correo = firstNonEmpty(usuario?.correo, usuario?.email, payload?.sub);
  const inferredName = correo.includes("@") ? correo.split("@")[0] : "";
  const nombre = firstNonEmpty(
    usuario?.nombre,
    usuario?.nombre_completo,
    payload?.name,
    inferredName,
    correo
  );
  const nombreCompleto = firstNonEmpty(
    usuario?.nombre_completo,
    usuario?.nombre,
    payload?.name,
    inferredName,
    correo
  );

  return {
    ...usuario,
    id_usuario: usuario?.id_usuario ?? usuario?.id ?? payload?.id ?? null,
    nombre,
    nombre_completo: nombreCompleto,
    correo,
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
  const token = data?.token ?? data?.accessToken;
  const usuario = data?.usuario ?? data?.user ?? {};
  const mergedUser = {
    ...usuario,
    roles: usuario?.roles ?? data?.roles,
    primerAcceso: data?.primerAcceso ?? usuario?.primerAcceso ?? false,
  };

  if (!token) {
    throw new Error("Respuesta inválida del servidor");
  }

  const user = normalizeUser(mergedUser, token);
  setStoredToken(token);
  setStoredUser(user);
  return user;
}

export function logout() {
  clearAuthStorage();
}
