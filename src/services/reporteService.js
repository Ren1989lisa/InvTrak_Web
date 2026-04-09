import { API_BASE_URL } from "../api/apiClient";

function getStoredToken() {
  return (
    window.localStorage.getItem("invtrack_auth_token") ||
    window.localStorage.getItem("token") ||
    null
  );
}

async function authRequest(method, endpoint, body, defaultMessage) {
  const token = getStoredToken();
  if (!token) {
    const error = new Error("No hay sesión activa.");
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
    const error = new Error("Sesión expirada.");
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
      "Error en la operación.";
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

function normalizeReporte(raw) {
  if (!raw || typeof raw !== "object") return raw;

  const activo = raw.activo ?? {};
  const prioridad = raw.prioridad ?? {};

  return {
    id_reporte: raw.id_reporte ?? raw.idReporte ?? null,
    folio: raw.folio ?? `REP-${raw.id_reporte ?? raw.idReporte ?? ""}`,
    tipo_falla: raw.tipo_falla ?? "",
    descripcion: raw.descripcion ?? "",
    fecha_reporte: raw.fecha_reporte ?? raw.fechaReporte ?? null,
    fecha_resolucion: raw.fecha_resolucion ?? raw.fechaResolucion ?? null,
    estatus: raw.estatus ?? "PENDIENTE",
    prioridad: prioridad.nombre ?? prioridad.prioridad ?? "MEDIA",
    id_activo: activo.idActivo ?? activo.id_activo ?? null,
    activo: {
      id_activo: activo.idActivo ?? activo.id_activo ?? null,
      etiqueta_bien: activo.etiquetaBien ?? activo.etiqueta_bien ?? "",
      numero_serie: activo.numeroSerie ?? activo.numero_serie ?? "",
      descripcion: activo.descripcion ?? "",
    },
  };
}

/**
 * Obtiene todos los reportes
 * @returns {Promise<Array>} Lista de reportes normalizados
 */
export async function getReportes() {
  const data = await authRequest(
    "GET",
    "/reporte",
    null,
    "No fue posible obtener los reportes."
  );

  const list = Array.isArray(data) ? data : (data?.data ?? data?.reportes ?? []);
  return list.map(normalizeReporte);
}

/**
 * Obtiene reportes de un activo específico
 * @param {number} activoId - ID del activo
 * @returns {Promise<Array>} Lista de reportes del activo
 */
export async function getReportesByActivo(activoId) {
  if (!activoId) {
    const error = new Error("El ID del activo es obligatorio.");
    error.status = 400;
    throw error;
  }

  const data = await authRequest(
    "GET",
    `/reporte/activo/${activoId}`,
    null,
    "No fue posible obtener los reportes del activo."
  );

  const list = Array.isArray(data) ? data : (data?.data ?? data?.reportes ?? []);
  return list.map(normalizeReporte);
}
