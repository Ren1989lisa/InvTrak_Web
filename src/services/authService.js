import {
  apiRequest,
  clearAuthSession,
  getStoredUser,
  getToken as getStoredToken,
  isTokenExpired,
  setAuthSession,
} from "./api";

function decodeJwtPayload(token) {
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

function mapRole(rawRole) {
  const flattened =
    rawRole && typeof rawRole === "object" && !Array.isArray(rawRole)
      ? [rawRole?.nombre ?? rawRole?.name ?? rawRole?.authority ?? rawRole?.role ?? rawRole?.rol]
      : Array.isArray(rawRole)
        ? rawRole.map((entry) =>
            entry && typeof entry === "object"
              ? (entry?.nombre ?? entry?.name ?? entry?.authority ?? entry?.role ?? entry?.rol)
              : entry
          )
        : [rawRole];

  const roleCandidates = flattened;
  const normalizedRoles = roleCandidates
    .map((r) => (r ?? "").toString().trim().toUpperCase())
    .filter(Boolean);

  if (normalizedRoles.includes("ROLE_ADMINISTRADOR")) return "admin";
  if (normalizedRoles.includes("ROLE_TECNICO")) return "tecnico";
  if (normalizedRoles.includes("ROLE_USUARIO")) return "usuario";
  if (normalizedRoles.includes("ADMINISTRADOR") || normalizedRoles.includes("ADMIN")) return "admin";
  if (normalizedRoles.includes("TECNICO")) return "tecnico";
  if (normalizedRoles.includes("USUARIO")) return "usuario";
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

export function getToken() {
  return getStoredToken();
}

export function getCurrentUser() {
  const token = getToken();
  if (!token) return null;

  if (isTokenExpired(token)) {
    clearAuthSession();
    return null;
  }

  const storedUser = getStoredUser();
  return normalizeUser(storedUser ?? {}, token);
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
    throw new Error("Respuesta invalida del servidor");
  }

  const user = normalizeUser(mergedUser, token);
  setAuthSession(token, user);
  return user;
}

export function logout() {
  clearAuthSession();
}
