import { API_BASE_URL } from "../api/apiClient";
import { apiRequest } from "./api";
import { normalizeActivo } from "../utils/entityFields";

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

  const activo = normalizeActivo(raw.activo ?? {});
  const prioridad = raw.prioridad ?? {};
  const tecnico = raw.tecnico ?? raw.usuarioTecnico ?? {};
  const prioridadNombre = (
    prioridad.nombre ??
    prioridad.prioridad ??
    raw.prioridad ??
    "MEDIA"
  )
    .toString()
    .trim()
    .toUpperCase();
  const evidencias = Array.isArray(raw?.evidencias) ? raw.evidencias : [];
  const fotosEvidencia = extractEvidenceUrls(evidencias);

  return {
    id_reporte: raw.id_reporte ?? raw.idReporte ?? null,
    folio: raw.folio ?? `REP-${raw.id_reporte ?? raw.idReporte ?? ""}`,
    tipo_falla: raw.tipo_falla ?? "",
    descripcion: raw.descripcion ?? "",
    fecha_reporte: raw.fecha_reporte ?? raw.fechaReporte ?? null,
    fecha_resolucion: raw.fecha_resolucion ?? raw.fechaResolucion ?? null,
    estatus: raw.estatus ?? "ABIERTO",
    prioridad: prioridadNombre,
    prioridad_id: prioridad.id_prioridad ?? prioridad.idPrioridad ?? null,
    id_activo: activo.id_activo ?? activo.idActivo ?? null,
    id_tecnico_asignado:
      raw.id_tecnico_asignado ??
      raw.idTecnicoAsignado ??
      tecnico.id_usuario ??
      tecnico.idUsuario ??
      tecnico.id ??
      null,
    tecnico,
    activo,
    evidencias,
    fotos_evidencia: fotosEvidencia,
  };
}

function toFiniteNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function extractCollection(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.result)) return payload.result;
  if (Array.isArray(payload?.evidencias)) return payload.evidencias;
  if (payload && typeof payload === "object") return [payload];
  return [];
}

function toAbsoluteEvidenceUrl(value) {
  const rawValue = String(value ?? "").trim();
  if (!rawValue) return "";

  if (/^data:/i.test(rawValue) || /^blob:/i.test(rawValue) || /^https?:\/\//i.test(rawValue)) {
    return rawValue;
  }

  const apiOrigin = API_BASE_URL.replace(/\/api$/i, "");
  if (rawValue.startsWith("/")) {
    return `${apiOrigin}${rawValue}`;
  }

  return `${apiOrigin}/${rawValue}`;
}

function extractEvidenceUrls(evidencias = []) {
  if (!Array.isArray(evidencias)) return [];

  const urls = [];
  evidencias.forEach((item) => {
    if (!item) return;

    if (typeof item === "string") {
      const resolved = toAbsoluteEvidenceUrl(item);
      if (resolved) urls.push(resolved);
      return;
    }

    const candidates = [
      item.url,
      item.urlArchivo,
      item.urlEvidencia,
      item.url_evidencia,
      item.ruta,
      item.rutaArchivo,
      item.rutaEvidencia,
      item.ruta_evidencia,
      item.path,
      item.uri,
      item.archivo,
      item.archivoUrl,
      item.evidencia,
      item.imagen,
      item.imagenUrl,
      item.urlFoto,
      item.fotoUrl,
      item.mediaUrl,
      item.archivo?.url,
      item.archivo?.ruta,
      item.archivo?.path,
      item.evidencia?.url,
      item.evidencia?.ruta,
      item.evidencia?.path,
    ];

    const firstValid = candidates.find((candidate) => String(candidate ?? "").trim());
    if (!firstValid) return;

    const resolved = toAbsoluteEvidenceUrl(firstValid);
    if (resolved) urls.push(resolved);
  });

  return Array.from(new Set(urls));
}

function getEvidenceId(item) {
  if (item === null || item === undefined) return null;
  if (typeof item === "number") return toFiniteNumber(item);
  if (typeof item === "string") {
    const maybeId = toFiniteNumber(item);
    return maybeId;
  }

  if (typeof item !== "object") return null;

  return (
    toFiniteNumber(item.id_evidencia) ??
    toFiniteNumber(item.idEvidencia) ??
    toFiniteNumber(item.evidenciaId) ??
    toFiniteNumber(item.id)
  );
}

async function tryFetchEvidencias(endpoint) {
  try {
    const payload = await apiRequest(endpoint, "GET");
    return extractCollection(payload);
  } catch (error) {
    const status = Number(error?.status ?? 0);
    if (status === 401 || status === 403) {
      throw error;
    }
    return [];
  }
}

export async function getEvidenciaUrlsByReferencia({
  reporteId,
  activoId,
  evidencias = [],
} = {}) {
  const resolvedReporteId = toFiniteNumber(reporteId);
  const resolvedActivoId = toFiniteNumber(activoId);

  const evidenceIds = new Set(
    (Array.isArray(evidencias) ? evidencias : [])
      .map(getEvidenceId)
      .filter((id) => Number.isFinite(id) && id > 0)
  );

  const evidenciasEncontradas = [...(Array.isArray(evidencias) ? evidencias : [])];
  const directUrls = extractEvidenceUrls(evidenciasEncontradas);

  if (Number.isFinite(resolvedReporteId) && resolvedReporteId > 0) {
    const fromReporte = await tryFetchEvidencias(`/evidencia/reporte/${resolvedReporteId}`);
    if (fromReporte.length) {
      evidenciasEncontradas.push(...fromReporte);
    }
  }

  if (
    evidenciasEncontradas.length === 0 &&
    Number.isFinite(resolvedActivoId) &&
    resolvedActivoId > 0
  ) {
    const reportesDelActivo = await tryFetchEvidencias(`/reporte/activo/${resolvedActivoId}`);
    const allEvidencias = (Array.isArray(reportesDelActivo) ? reportesDelActivo : []).flatMap(
      (item) => (Array.isArray(item?.evidencias) ? item.evidencias : [])
    );
    if (allEvidencias.length) {
      evidenciasEncontradas.push(...allEvidencias);
    }
  }

  const remainingEvidenceIds = new Set(
    Array.from(evidenceIds).filter(
      (id) =>
        !evidenciasEncontradas.some((item) => Number(getEvidenceId(item)) === Number(id))
    )
  );

  const endpointsById = Array.from(remainingEvidenceIds).map((id) => `/evidencia/${id}`);

  for (const endpoint of endpointsById) {
    const rows = await tryFetchEvidencias(endpoint);
    if (!rows.length) continue;
    evidenciasEncontradas.push(...rows);
  }

  const mergedUrls = Array.from(
    new Set([
      ...directUrls,
      ...extractEvidenceUrls(evidenciasEncontradas),
    ])
  );

  return mergedUrls;
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

export async function getReporteById(reporteId) {
  const resolvedId = Number(reporteId);
  if (!Number.isFinite(resolvedId) || resolvedId <= 0) {
    const error = new Error("El ID del reporte es obligatorio.");
    error.status = 400;
    throw error;
  }

  try {
    const data = await authRequest(
      "GET",
      `/reporte/${resolvedId}`,
      null,
      "No fue posible obtener el reporte."
    );
    return normalizeReporte(data?.data ?? data);
  } catch (error) {
    const status = Number(error?.status ?? 0);
    if (status !== 404 && status !== 500) {
      throw error;
    }
  }

  const reportes = await getReportes();
  const found = reportes.find((item) => Number(item?.id_reporte) === resolvedId);
  if (found) return normalizeReporte(found);

  const notFoundError = new Error("Reporte no encontrado.");
  notFoundError.status = 404;
  throw notFoundError;
}

/**
 * Obtiene prioridades reales desde backend (/api/prioridad)
 * Retorna un mapa por nombre (ALTA/MEDIA/BAJA) con su id.
 */
export async function getPrioridadesMap() {
  const data = await authRequest(
    "GET",
    "/prioridad",
    null,
    "No fue posible obtener las prioridades."
  );

  const list = Array.isArray(data) ? data : (data?.data ?? data?.prioridades ?? []);
  const map = {};

  list.forEach((item) => {
    const nombre = String(item?.nombre ?? "").trim().toUpperCase();
    const id = Number(item?.id_prioridad ?? item?.idPrioridad ?? item?.id);
    if (!nombre || !Number.isFinite(id) || id <= 0) return;
    map[nombre] = id;
  });

  return map;
}

/**
 * Crea un reporte de danio con evidencias
 * Backend espera multipart/form-data con:
 * - datos: JSON { activoId, tipoFalla, descripcion, prioridadId }
 * - archivos: List<MultipartFile>
 */
export async function createReporte({ activoId, tipoFalla, descripcion, prioridadId, archivos }) {
  const resolvedActivoId = Number(activoId);
  const resolvedPrioridadId = Number(prioridadId);
  const normalizedTipoFalla = String(tipoFalla ?? "").trim();
  const normalizedDescripcion = String(descripcion ?? "").trim();
  const evidenceFiles = Array.isArray(archivos) ? archivos.filter(Boolean) : [];

  if (!Number.isFinite(resolvedActivoId) || resolvedActivoId <= 0) {
    const error = new Error("El activo es obligatorio.");
    error.status = 400;
    throw error;
  }

  if (!normalizedTipoFalla) {
    const error = new Error("El tipo de falla es obligatorio.");
    error.status = 400;
    throw error;
  }

  if (!normalizedDescripcion) {
    const error = new Error("La descripcion es obligatoria.");
    error.status = 400;
    throw error;
  }

  if (!Number.isFinite(resolvedPrioridadId) || resolvedPrioridadId <= 0) {
    const error = new Error("La prioridad es obligatoria.");
    error.status = 400;
    throw error;
  }

  if (!evidenceFiles.length) {
    const error = new Error("Debes subir al menos una evidencia.");
    error.status = 400;
    throw error;
  }

  const dto = {
    activoId: resolvedActivoId,
    tipoFalla: normalizedTipoFalla,
    descripcion: normalizedDescripcion,
    prioridadId: resolvedPrioridadId,
  };

  const formData = new FormData();
  formData.append("datos", new Blob([JSON.stringify(dto)], { type: "application/json" }));
  evidenceFiles.forEach((file) => {
    formData.append("archivos", file);
  });

  const data = await apiRequest("/reporte", "POST", formData);
  return normalizeReporte(data?.data ?? data);
}
