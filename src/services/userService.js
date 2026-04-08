import { API_BASE_URL } from "../api/apiClient";

function getStoredToken() {
  return (
    window.localStorage.getItem("invtrack_auth_token") ||
    window.localStorage.getItem("token") ||
    null
  );
}

async function parseJsonSafe(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function mapRol(value) {
  const role = (value ?? "").toString().trim().toUpperCase();
  if (role === "ROLE_ADMINISTRADOR") return "admin";
  if (role === "ROLE_TECNICO") return "tecnico";
  if (role === "ROLE_USUARIO") return "usuario";
  return (value ?? "").toString().trim().toLowerCase();
}

function normalizeUsuario(raw = {}) {
  return {
    ...raw,
    id_usuario: raw?.id_usuario ?? raw?.idUsuario ?? raw?.id ?? null,
    nombre: raw?.nombre ?? raw?.nombreCompleto ?? raw?.nombre_completo ?? "",
    nombre_completo: raw?.nombreCompleto ?? raw?.nombre_completo ?? raw?.nombre ?? "",
    correo: raw?.correo ?? raw?.email ?? "",
    numero_empleado: raw?.numero_empleado ?? raw?.numeroEmpleado ?? "",
    area: raw?.area ?? raw?.departamento ?? "",
    curp: raw?.curp ?? "",
    fecha_nacimiento: raw?.fecha_nacimiento ?? raw?.fechaNacimiento ?? "",
    rol: mapRol(raw?.rol ?? raw?.role),
  };
}

function extractList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.usuarios)) return payload.usuarios;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

async function authGet(endpoint, defaultMessage) {
  const token = getStoredToken();
  if (!token) {
    const error = new Error("No hay sesión activa.");
    error.status = 401;
    throw error;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await parseJsonSafe(response);
  if (!response.ok) {
    const error = new Error(data?.message || defaultMessage);
    error.status = response.status;
    throw error;
  }

  return data;
}

export async function getPerfilActual() {
  return authGet("/usuario/me", "No fue posible obtener el perfil.");
}

export async function getUsuarios() {
  const endpoints = ["/usuario", "/usuarios"];
  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      const data = await authGet(endpoint, "No fue posible obtener los usuarios.");
      return extractList(data).map(normalizeUsuario);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error("No fue posible obtener los usuarios.");
}
