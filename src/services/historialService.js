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

function normalizeHistorial(raw) {
  if (!raw || typeof raw !== "object") return raw;

  const activo = raw.activo ?? {};
  const usuario = raw.usuario ?? {};

  return {
    id_historial: raw.id_historial ?? raw.idHistorial ?? null,
    estatus_anterior: raw.estatus_anterior ?? raw.estatusAnterior ?? "",
    estatus_nuevo: raw.estatus_nuevo ?? raw.estatusNuevo ?? "",
    fecha_cambio: raw.fecha_cambio ?? raw.fechaCambio ?? null,
    fecha: raw.fecha_cambio ?? raw.fechaCambio ?? null, // Alias para compatibilidad
    motivo: raw.motivo ?? raw.observacion ?? "",
    tipo_evento: raw.tipo_evento ?? raw.tipoEvento ?? "cambio_estatus",
    id_activo: activo.idActivo ?? activo.id_activo ?? null,
    activo: {
      id_activo: activo.idActivo ?? activo.id_activo ?? null,
      etiqueta_bien: activo.etiquetaBien ?? activo.etiqueta_bien ?? "",
      numero_serie: activo.numeroSerie ?? activo.numero_serie ?? "",
      descripcion: activo.descripcion ?? "",
    },
    usuario: {
      id_usuario: usuario.idUsuario ?? usuario.id_usuario ?? null,
      nombre: usuario.nombre ?? "",
      correo: usuario.correo ?? "",
      numero_empleado: usuario.numeroEmpleado ?? usuario.numero_empleado ?? "",
    },
  };
}

/**
 * Obtiene todo el historial (requiere rol ADMINISTRADOR)
 * @returns {Promise<Array>} Lista de eventos del historial
 */
export async function getHistorial() {
  const data = await authRequest(
    "GET",
    "/historial",
    null,
    "No fue posible obtener el historial."
  );

  const list = Array.isArray(data) ? data : (data?.data ?? data?.historial ?? []);
  return list.map(normalizeHistorial);
}

/**
 * Obtiene el historial de un activo específico
 * @param {number} activoId - ID del activo
 * @returns {Promise<Array>} Lista de eventos del activo
 */
export async function getHistorialByActivo(activoId) {
  if (!activoId) {
    const error = new Error("El ID del activo es obligatorio.");
    error.status = 400;
    throw error;
  }

  const data = await authRequest(
    "GET",
    `/historial/activo/${activoId}`,
    null,
    "No fue posible obtener el historial del activo."
  );

  const list = Array.isArray(data) ? data : (data?.data ?? data?.historial ?? []);
  return list.map(normalizeHistorial);
}
