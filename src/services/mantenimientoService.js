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

function normalizeStatus(value) {
  return String(value ?? "").trim().toUpperCase();
}

const ESTATUS_MANTENIMIENTO_ACTIVOS = new Set(["PENDIENTE", "EN_PROCESO"]);

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

function normalizeMantenimiento(raw = {}) {
  const prioridad = raw?.prioridad ?? {};
  const reporte = raw?.reporte ?? {};
  const activo = normalizeActivo(reporte?.activo ?? {});

  return {
    ...raw,
    id_mantenimiento: toNumberOrNull(raw?.id_mantenimiento ?? raw?.idMantenimiento ?? raw?.id),
    estatus: (raw?.estatus ?? "").toString().trim().toUpperCase(),
    fecha_inicio: raw?.fecha_inicio ?? raw?.fechaInicio ?? "",
    fecha_fin: raw?.fecha_fin ?? raw?.fechaFin ?? "",
    prioridad_id: toNumberOrNull(prioridad?.id_prioridad ?? prioridad?.idPrioridad),
    prioridad_nombre: (prioridad?.nombre ?? "").toString().trim().toUpperCase(),
    reporte: {
      ...reporte,
      id_reporte: toNumberOrNull(reporte?.id_reporte ?? reporte?.idReporte ?? reporte?.id),
      descripcion: reporte?.descripcion ?? "",
      fecha_reporte: reporte?.fecha_reporte ?? reporte?.fechaReporte ?? "",
      tipo_falla: reporte?.tipo_falla ?? reporte?.tipoFalla ?? "",
      estatus: (reporte?.estatus ?? "").toString().trim().toUpperCase(),
      activo,
    },
  };
}

export function isMantenimientoActivo(estatus) {
  return ESTATUS_MANTENIMIENTO_ACTIVOS.has(normalizeStatus(estatus));
}

export async function getReportesAbiertosMantenimiento() {
  const payload = await apiRequest("/mantenimiento/reportes-abiertos", "GET");
  const list = extractCollection(payload).map(normalizeReporteAbierto);

  // Requisito funcional: solo activos en estatus REPORTADO.
  return list.filter(
    (item) => String(item?.activo?.estatus ?? "").toUpperCase() === "REPORTADO"
  );
}

export async function getMantenimientosByTecnico(tecnicoId) {
  const parsedTecnicoId = toNumberOrNull(tecnicoId);
  if (!parsedTecnicoId || parsedTecnicoId <= 0) {
    const error = new Error("El ID del tecnico es obligatorio.");
    error.status = 400;
    throw error;
  }

  const payload = await apiRequest(`/mantenimiento/tecnico/${parsedTecnicoId}`, "GET");
  return extractCollection(payload).map(normalizeMantenimiento);
}

export async function atenderMantenimiento({
  mantenimientoId,
  diagnostico,
  accionesRealizadas,
  piezasUtilizadas = "",
  fotos = [],
}) {
  const parsedMantenimientoId = toNumberOrNull(mantenimientoId);
  const normalizedDiagnostico = String(diagnostico ?? "").trim();
  const normalizedAcciones = String(accionesRealizadas ?? "").trim();
  const normalizedPiezas = String(piezasUtilizadas ?? "").trim();
  const evidencias = Array.isArray(fotos) ? fotos.filter(Boolean) : [];

  if (!parsedMantenimientoId || parsedMantenimientoId <= 0) {
    const error = new Error("No se encontro el mantenimiento asignado.");
    error.status = 400;
    throw error;
  }

  if (!normalizedDiagnostico) {
    const error = new Error("El diagnostico es obligatorio.");
    error.status = 400;
    throw error;
  }

  if (!normalizedAcciones) {
    const error = new Error("Las acciones realizadas son obligatorias.");
    error.status = 400;
    throw error;
  }

  if (!evidencias.length) {
    const error = new Error("Debes subir al menos una evidencia para finalizar la reparacion.");
    error.status = 400;
    throw error;
  }

  const dto = {
    mantenimientoId: parsedMantenimientoId,
    diagnostico: normalizedDiagnostico,
    accionesRealizadas: normalizedAcciones,
    piezasUtilizadas: normalizedPiezas,
  };

  const formData = new FormData();
  formData.append("datos", new Blob([JSON.stringify(dto)], { type: "application/json" }));
  evidencias.forEach((file) => {
    formData.append("fotos", file);
  });

  const payload = await apiRequest("/mantenimiento/atender", "PUT", formData);
  return normalizeMantenimiento(payload?.data ?? payload);
}

export async function cerrarMantenimiento({
  mantenimientoId,
  estatusFinal = "REPARADO",
  observaciones = "",
}) {
  const parsedMantenimientoId = toNumberOrNull(mantenimientoId);
  const normalizedEstatusFinal = normalizeStatus(estatusFinal);
  const normalizedObservaciones = String(observaciones ?? "").trim();

  if (!parsedMantenimientoId || parsedMantenimientoId <= 0) {
    const error = new Error("No se encontro el mantenimiento asignado.");
    error.status = 400;
    throw error;
  }

  if (!["REPARADO", "IRREPARABLE"].includes(normalizedEstatusFinal)) {
    const error = new Error("El estatus final debe ser REPARADO o IRREPARABLE.");
    error.status = 400;
    throw error;
  }

  const payload = await apiRequest("/mantenimiento/cerrar", "PUT", {
    mantenimientoId: parsedMantenimientoId,
    estatusFinal: normalizedEstatusFinal,
    observaciones: normalizedObservaciones,
  });

  return normalizeMantenimiento(payload?.data ?? payload);
}

export async function solicitarBajaMantenimiento({
  mantenimientoId,
  observaciones = "",
}) {
  const parsedMantenimientoId = toNumberOrNull(mantenimientoId);
  const normalizedObservaciones = String(observaciones ?? "").trim();

  if (!parsedMantenimientoId || parsedMantenimientoId <= 0) {
    const error = new Error("No se encontro el mantenimiento asignado.");
    error.status = 400;
    throw error;
  }

  const payload = await apiRequest("/mantenimiento/solicitar-baja", "PUT", {
    mantenimientoId: parsedMantenimientoId,
    observaciones: normalizedObservaciones,
  });

  return normalizeMantenimiento(payload?.data ?? payload);
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
