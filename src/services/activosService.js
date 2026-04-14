import { API_BASE_URL } from "../api/apiClient";
import { normalizeActivosList } from "../utils/entityFields";

function getStoredToken() {
  return (
    window.localStorage.getItem("invtrack_auth_token") ||
    window.localStorage.getItem("token") ||
    null
  );
}

function extractActivos(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.activos)) return payload.activos;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function normalizeText(value) {
  return (value ?? "").toString().trim().toLowerCase();
}

function isAssignableActivo(activo) {
  const estatus = String(activo?.estatus ?? "").toUpperCase();
  if (estatus !== "DISPONIBLE") return false;

  const estadoAsignacion = normalizeText(
    activo?.estado_asignacion ?? activo?.estadoAsignacion
  )
    .replace(/_/g, " ")
    .replace(/\s+/g, " ");

  // Pendiente de confirmación ya no debe mostrarse para reasignar.
  if (estadoAsignacion.includes("pendiente") && estadoAsignacion.includes("confirm")) {
    return false;
  }

  if (estadoAsignacion.includes("confirmad") || estadoAsignacion.includes("resguardad")) {
    return false;
  }

  const propietario = normalizeText(activo?.propietario ?? activo?.responsable ?? activo?.usuario?.nombre);
  if (propietario && !propietario.includes("pendiente de asignacion")) {
    return false;
  }

  return true;
}

async function authRequest(method, endpoint, body, defaultMessage) {
  const token = getStoredToken();
  if (!token) {
    const error = new Error("No hay sesion activa.");
    error.status = 401;
    throw error;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401) {
    const error = new Error("Sesion expirada.");
    error.status = 401;
    throw error;
  }

  if (!response.ok) {
    let data;
    try {
      data = await response.json();
    } catch {
      data = null;
    }
    const message =
      data?.message ||
      data?.error ||
      data?.errors?.[0]?.defaultMessage ||
      defaultMessage ||
      "Error en la operacion.";
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function getActivosFromService() {
  const data = await authRequest(
    "GET",
    "/activo",
    null,
    "No fue posible obtener los bienes registrados."
  );
  return normalizeActivosList(extractActivos(data));
}

export async function getActivosDisponibles() {
  try {
    const data = await authRequest(
      "GET",
      "/activo/disponibles",
      null,
      "No fue posible obtener los bienes disponibles."
    );
    return normalizeActivosList(extractActivos(data)).filter(isAssignableActivo);
  } catch (error) {
    // Compatibilidad: algunos backends no exponen /activo/disponibles por permisos o ruta.
    // En esos casos, usamos /activo y filtrado local.
    if (error?.status && ![401, 403, 404, 405].includes(error.status)) {
      throw error;
    }

    const activos = await getActivosFromService();
    return activos.filter(isAssignableActivo);
  }
}
