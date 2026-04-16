import { apiRequest } from "./api";

function normalizeText(value) {
  return (value ?? "").toString().trim();
}

function normalizeTipoEvento(value) {
  const normalized = normalizeText(value).toLowerCase().replace(/\s+/g, "_");
  if (!normalized) return "cambio_estatus";

  if (normalized.includes("mantenimiento")) return "mantenimiento";
  if (normalized.includes("asignacion")) return "asignacion";
  if (normalized.includes("reporte")) return "reporte";
  if (normalized.includes("estatus") || normalized.includes("estado")) return "cambio_estatus";

  return normalized;
}

function toNumberOrNull(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function extractList(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  const candidates = [
    payload.data,
    payload.content,
    payload.items,
    payload.results,
    payload.historial,
    payload.registros,
    payload.rows,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
}

function getUsuarioDisplayName(rawUsuario) {
  if (!rawUsuario) return "";
  if (typeof rawUsuario === "string") return normalizeText(rawUsuario);

  return normalizeText(
    rawUsuario.nombre ||
      rawUsuario.nombreCompleto ||
      rawUsuario.nombre_completo ||
      rawUsuario.correo
  );
}

function normalizeHistorial(raw = {}) {
  if (!raw || typeof raw !== "object") return raw;

  const activo = raw.activo ?? {};
  const usuario = raw.usuario ?? raw.user ?? null;
  const usuarioDisplay = getUsuarioDisplayName(usuario);
  const activoId = toNumberOrNull(
    raw.id_activo ?? raw.idActivo ?? raw.activoId ?? activo.idActivo ?? activo.id_activo
  );
  const codigoActivo = normalizeText(
    raw.codigo_activo ??
      raw.codigoActivo ??
      raw.etiquetaBien ??
      raw.etiqueta_bien ??
      activo.etiquetaBien ??
      activo.etiqueta_bien
  );

  const observacion = normalizeText(raw.observacion ?? raw.observaciones ?? raw.motivo ?? "");
  const fecha =
    raw.fecha ?? raw.fecha_cambio ?? raw.fechaCambio ?? raw.fechaEvento ?? raw.createdAt ?? null;

  return {
    id_historial: raw.id_historial ?? raw.idHistorial ?? null,
    estatus_anterior: normalizeText(raw.estatus_anterior ?? raw.estatusAnterior ?? ""),
    estatus_nuevo: normalizeText(raw.estatus_nuevo ?? raw.estatusNuevo ?? ""),
    fecha_cambio: raw.fecha_cambio ?? raw.fechaCambio ?? fecha,
    fecha,
    motivo: observacion,
    observacion,
    tipo_evento: normalizeTipoEvento(raw.tipo_evento ?? raw.tipoEvento ?? raw.tipo),
    id_activo: activoId,
    codigo_activo: codigoActivo || "—",
    usuario: usuarioDisplay || "—",
    tecnico: normalizeText(raw.tecnico ?? raw.nombreTecnico ?? ""),
    tecnico_asignado: normalizeText(raw.tecnico_asignado ?? raw.tecnicoAsignado ?? ""),
    reporte_relacionado: normalizeText(raw.reporte_relacionado ?? raw.reporteRelacionado ?? ""),
    folio_reporte: normalizeText(raw.folio_reporte ?? raw.folioReporte ?? ""),
    tipo_mantenimiento: normalizeText(raw.tipo_mantenimiento ?? raw.tipoMantenimiento ?? ""),
    diagnostico: normalizeText(raw.diagnostico ?? raw.detalle ?? ""),
    prioridad: normalizeText(raw.prioridad ?? ""),
    activo: {
      id_activo: toNumberOrNull(activo.idActivo ?? activo.id_activo ?? activoId),
      etiqueta_bien: normalizeText(activo.etiquetaBien ?? activo.etiqueta_bien ?? codigoActivo),
      numero_serie: normalizeText(activo.numeroSerie ?? activo.numero_serie ?? ""),
      descripcion: normalizeText(activo.descripcion ?? ""),
    },
    usuario_detalle:
      usuario && typeof usuario === "object"
        ? {
            id_usuario: toNumberOrNull(usuario.idUsuario ?? usuario.id_usuario),
            nombre: normalizeText(usuario.nombre ?? ""),
            correo: normalizeText(usuario.correo ?? ""),
            numero_empleado: normalizeText(usuario.numeroEmpleado ?? usuario.numero_empleado ?? ""),
          }
        : null,
  };
}

function sortByDateDesc(list = []) {
  return [...list].sort((a, b) => {
    const left = new Date(a?.fecha ?? 0).getTime();
    const right = new Date(b?.fecha ?? 0).getTime();
    return right - left;
  });
}

function normalizeHistorialResponse(payload) {
  let candidatePayload = payload;

  if (typeof payload === "string") {
    const text = payload.trim();
    if (!text) return [];
    try {
      candidatePayload = JSON.parse(text);
    } catch {
      return [];
    }
  }

  const list = extractList(candidatePayload);
  return sortByDateDesc(list.map(normalizeHistorial));
}

export async function getHistorial() {
  const data = await apiRequest("/historial", "GET");
  return normalizeHistorialResponse(data);
}

export async function getHistorialByActivo(activoId) {
  if (!activoId) {
    const error = new Error("El ID del activo es obligatorio.");
    error.status = 400;
    throw error;
  }

  const data = await apiRequest(`/historial/activo/${activoId}`, "GET");
  return normalizeHistorialResponse(data);
}
