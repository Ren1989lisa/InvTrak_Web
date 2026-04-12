import { apiRequest } from "../api/apiClient";
import { getPerfilActual } from "./userService";

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

/**
 * Normaliza cualquier forma de rol del backend (string, enum, objeto anidado, authorities).
 */
function collectRoleStrings(raw) {
  if (raw == null) return [];
  if (Array.isArray(raw)) {
    return raw.flatMap((item) => collectRoleStrings(item));
  }
  if (typeof raw === "object") {
    const nested =
      raw.nombre ??
      raw.name ??
      raw.rol ??
      raw.role ??
      raw.authority ??
      raw.authorityName ??
      raw.value;
    if (nested != null && nested !== raw) {
      return collectRoleStrings(nested);
    }
    return [];
  }
  const s = String(raw).trim();
  return s ? [s] : [];
}

/**
 * Recorre el payload del JWT (objetos anidados tipo Keycloak realm_access.roles, etc.)
 */
function deepCollectRoleStrings(value, depth = 0) {
  if (value == null || depth > 10) return [];
  if (typeof value === "number" || typeof value === "boolean") return [];
  if (typeof value === "string") {
    const t = value.trim();
    if (!t) return [];
    if (/[,;\s]/.test(t) && /ROLE_/i.test(t)) {
      return t.split(/[\s,;]+/).filter(Boolean);
    }
    return [t];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item) => deepCollectRoleStrings(item, depth + 1));
  }
  if (typeof value === "object") {
    return Object.values(value).flatMap((v) => deepCollectRoleStrings(v, depth + 1));
  }
  return [];
}

function mapRole(rawRole) {
  const strings = collectRoleStrings(rawRole).map((s) => s.toUpperCase());

  const isAdmin = strings.some(
    (r) =>
      r === "ROLE_ADMINISTRADOR" ||
      r === "ADMINISTRADOR" ||
      r === "ADMIN" ||
      r.includes("ADMINISTRADOR") ||
      r.endsWith("ADMINISTRADOR")
  );
  const isTecnico = strings.some(
    (r) => r === "ROLE_TECNICO" || r === "TECNICO" || r.endsWith("TECNICO")
  );
  const isUsuario = strings.some(
    (r) => r === "ROLE_USUARIO" || r === "USUARIO" || r.endsWith("USUARIO")
  );

  if (isAdmin) return "admin";
  if (isTecnico) return "tecnico";
  if (isUsuario) return "usuario";
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
  const fromJwt = payload ? deepCollectRoleStrings(payload) : [];
  // Combinar usuario guardado + claims completos del JWT (sub, exp, etc. aportan cadenas sin ROLE_ — se ignoran al mapear)
  const rol = mapRole([
    usuario?.rol,
    usuario?.role,
    usuario?.roles,
    usuario?.authorities,
    payload?.rol,
    payload?.role,
    payload?.roles,
    payload?.authorities,
    ...fromJwt,
  ]);
  const correo = firstNonEmpty(usuario?.correo, usuario?.email, payload?.sub);
  
  // Priorizar el nombre del backend sobre el correo
  const nombre = firstNonEmpty(usuario?.nombre, usuario?.nombre_completo, payload?.name);
  const nombreCompleto = firstNonEmpty(usuario?.nombre_completo, usuario?.nombre, payload?.name);
  const displayNombre = firstNonEmpty(
    nombre,
    nombreCompleto,
    correo.includes("@") ? correo.split("@")[0] : correo
  );

  return {
    ...usuario,
    id_usuario: usuario?.id_usuario ?? usuario?.id ?? payload?.id ?? payload?.idUsuario ?? null,
    nombre: displayNombre,
    nombre_completo: displayNombre,
    correo,
    rol,
  };
}

function mapPerfilResponseToUserFields(perfil) {
  if (!perfil || typeof perfil !== "object") return {};
  const rawRol = perfil.rol ?? perfil.role;
  const out = {
    id_usuario: perfil.idUsuario ?? perfil.id_usuario ?? null,
    nombre: perfil.nombre ?? "",
    nombre_completo: perfil.nombre ?? perfil.nombreCompleto ?? perfil.nombre_completo ?? "",
    correo: perfil.correo ?? "",
    numero_empleado: perfil.numeroEmpleado ?? perfil.numero_empleado ?? "",
    area: perfil.area ?? "",
    curp: perfil.curp ?? "",
    fecha_nacimiento: perfil.fechaNacimiento ?? perfil.fecha_nacimiento ?? "",
  };
  if (rawRol != null) {
    out.rol = rawRol;
  }
  return out;
}

/**
 * Actualiza el usuario en localStorage con GET /usuario/me (nombre real, etc.).
 * @returns {Promise<object|null>}
 */
export async function refreshCurrentUserProfile() {
  const token = getToken();
  if (!token) return null;

  let parsedUser = {};
  try {
    const raw = window.localStorage.getItem(USER_KEY);
    parsedUser = raw ? JSON.parse(raw) : {};
  } catch {
    parsedUser = {};
  }

  const rawPerfil = await getPerfilActual();
  const perfil =
    rawPerfil?.usuario ??
    rawPerfil?.user ??
    rawPerfil?.data ??
    rawPerfil?.perfil ??
    rawPerfil;
  const fromPerfil = mapPerfilResponseToUserFields(perfil);
  const merged = { ...parsedUser, ...fromPerfil };
  const user = normalizeUser(merged, token);
  setStoredUser(user);
  return user;
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
    roles: usuario?.roles ?? data?.roles ?? data?.authorities,
    authorities: usuario?.authorities ?? data?.authorities,
    role: usuario?.role ?? data?.role,
    primerAcceso: data?.primerAcceso ?? usuario?.primerAcceso ?? false,
  };

  if (!token) {
    throw new Error("Respuesta inválida del servidor");
  }

  setStoredToken(token);
  const provisional = normalizeUser(mergedUser, token);
  setStoredUser(provisional);

  try {
    await refreshCurrentUserProfile();
  } catch {
    // Sin perfil remoto: se mantiene usuario provisional (sub del JWT / correo)
  }

  return getCurrentUser();
}

export function logout() {
  clearAuthStorage();
}
