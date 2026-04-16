import { apiRequest } from "../api/apiClient";
import { normalizeActivo } from "../utils/entityFields";

function extractCollection(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.result)) return payload.result;
  if (Array.isArray(payload?.reportes)) return payload.reportes;
  return [];
}

function toNumberOrNull(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeReporteAbierto(raw = {}) {
  const activo = normalizeActivo(raw?.activo ?? {});
  const prioridad = raw?.prioridad ?? {};

  return {
    ...raw,
    id_reporte: toNumberOrNull(raw?.id_reporte ?? raw?.idReporte ?? raw?.id),
    descripcion: raw?.descripcion ?? "",
    tipo_falla: raw?.tipo_falla ?? raw?.tipoFalla ?? "",
    fecha_reporte: raw?.fecha_reporte ?? raw?.fechaReporte ?? "",
    estatus: (raw?.estatus ?? "").toString().trim().toUpperCase(),
    prioridad_id: toNumberOrNull(prioridad?.id_prioridad ?? prioridad?.idPrioridad),
    prioridad_nombre: (prioridad?.nombre ?? "").toString().trim().toUpperCase(),
    activo,
  };
}

export async function getReportesAbiertosMantenimiento() {
  const payload = await apiRequest("/mantenimiento/reportes-abiertos", "GET");
  const list = extractCollection(payload).map(normalizeReporteAbierto);

  // Requisito funcional: solo activos en estatus REPORTADO.
  return list.filter(
    (item) => String(item?.activo?.estatus ?? "").toUpperCase() === "REPORTADO"
  );
}

export async function asignarReporteMantenimiento({
  reporteId,
  tecnicoId,
  prioridadId,
  tipo = "CORRECTIVO",
}) {
  const parsedReporteId = toNumberOrNull(reporteId);
  const parsedTecnicoId = toNumberOrNull(tecnicoId);
  const parsedPrioridadId = toNumberOrNull(prioridadId);

  if (!parsedReporteId || !parsedTecnicoId || !parsedPrioridadId) {
    const error = new Error("Faltan datos obligatorios para asignar el reporte.");
    error.status = 400;
    throw error;
  }

  const payload = {
    reporteId: parsedReporteId,
    tecnicoId: parsedTecnicoId,
    prioridadId: parsedPrioridadId,
    tipo: String(tipo || "CORRECTIVO").toUpperCase(),
  };

  return apiRequest("/mantenimiento", "POST", payload);
}
