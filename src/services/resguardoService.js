import { apiRequest } from "./api";
import { normalizeActivo, normalizeUsuario as normalizeEntityUsuario } from "../utils/entityFields";

function normalizeText(value) {
  return (value ?? "").toString().trim();
}

function normalizeBoolean(value) {
  if (value === true || value === false) return value;
  if (value == null) return false;

  const normalized = normalizeText(value).toLowerCase();
  if (!normalized) return false;

  if (
    ["true", "1", "si", "sí", "yes", "confirmado", "confirmada", "confirmed", "resguardado"].includes(normalized) ||
    normalized.includes("confirmado") ||
    normalized.includes("confirmada")
  ) {
    return true;
  }

  if (
    ["false", "0", "no", "pendiente", "null", "undefined"].includes(normalized) ||
    normalized.includes("pendiente") ||
    normalized.includes("pending")
  ) {
    return false;
  }

  return Boolean(value);
}

function toNumberOrValue(value) {
  if (value == null) return null;

  const text = String(value).trim();
  if (!text) return null;

  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : text;
}

function extractPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return payload ?? null;

  const candidates = [
    payload.data,
    payload.resguardo,
    payload.resguardos,
    payload.item,
    payload.items,
    payload.result,
    payload.results,
  ];

  for (const candidate of candidates) {
    if (candidate != null) {
      return candidate;
    }
  }

  return payload;
}

function extractList(payload) {
  const data = extractPayload(payload);
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];

  const candidates = [
    data.data,
    data.content,
    data.items,
    data.results,
    data.resguardos,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return "";
}

export function normalizeResguardo(raw = {}) {
  const source = raw && typeof raw === "object" ? raw : {};
  const activoSource = source.activo ?? source.bien ?? source.asset ?? source.activoDetalle ?? {};
  const usuarioSource = source.usuario ?? source.user ?? source.usuarioAsignado ?? {};

  const activo = normalizeActivo(
    activoSource && typeof activoSource === "object" && Object.keys(activoSource).length > 0
      ? activoSource
      : source
  );
  const usuario = normalizeEntityUsuario(usuarioSource);

  const resguardoId = toNumberOrValue(
    firstNonEmpty(
      source.id_resguardo,
      source.idResguardo,
      source.resguardoId,
      source.id
    )
  );
  const activoId = toNumberOrValue(
    firstNonEmpty(
      source.activoId,
      source.id_activo,
      source.idActivo,
      activo?.id_activo,
      activo?.idActivo
    )
  );
  const usuarioId = toNumberOrValue(
    firstNonEmpty(
      source.usuarioId,
      source.id_usuario,
      source.idUsuario,
      usuario?.id_usuario,
      usuario?.idUsuario
    )
  );

  const confirmado = normalizeBoolean(
    source.confirmado ??
      source.confirmada ??
      source.confirmed ??
      source.estadoConfirmacion ??
      source.estado_confirmacion
  );
  const fechaDevolucion = source.fechaDevolucion ?? source.fecha_devolucion ?? null;
  const fechaConfirmacion = source.fechaConfirmacion ?? source.fecha_confirmacion ?? null;
  const fechaAsignacion = source.fechaAsignacion ?? source.fecha_asignacion ?? source.createdAt ?? null;
  const observaciones = normalizeText(
    source.observaciones ?? source.observacion ?? source.comentarios ?? ""
  );

  return {
    ...source,
    id_resguardo: resguardoId,
    resguardoId,
    activoId,
    usuarioId,
    confirmado,
    fechaAsignacion,
    fechaConfirmacion,
    fechaDevolucion,
    observaciones,
    activo,
    usuario,
  };
}

export function isResguardoPendiente(resguardo) {
  const item = normalizeResguardo(resguardo);
  return item.confirmado === false;
}

export function isResguardoConfirmado(resguardo) {
  const item = normalizeResguardo(resguardo);
  const fechaDevolucion = normalizeText(item.fechaDevolucion);
  return item.confirmado === true && !fechaDevolucion;
}

export function resguardoToActivo(resguardo) {
  const item = normalizeResguardo(resguardo);
  const activo = normalizeActivo(item.activo ?? {});
  const ownerName = firstNonEmpty(
    item.usuario?.nombre_completo,
    item.usuario?.nombre,
    item.usuario?.correo,
    activo?.propietario
  );

  return {
    ...activo,
    id_activo: toNumberOrValue(item.activoId ?? activo?.id_activo ?? activo?.idActivo),
    propietario: ownerName,
    estado_asignacion: item.confirmado === true ? "confirmado" : "pendiente de confirmacion",
    estatus: normalizeText(activo?.estatus).toUpperCase() || "RESGUARDADO",
  };
}

export async function getResguardos() {
  const payload = await apiRequest("/resguardo", "GET");
  return extractList(payload).map(normalizeResguardo);
}

export async function createResguardo(input) {
  if (!input?.activoId) {
    const error = new Error("El ID del activo es obligatorio.");
    error.status = 400;
    throw error;
  }

  if (!input?.usuarioId) {
    const error = new Error("El ID del usuario es obligatorio.");
    error.status = 400;
    throw error;
  }

  const payload = {
    activoId: Number(input.activoId),
    usuarioId: Number(input.usuarioId),
    observaciones: input.observaciones ?? "",
  };

  const response = await apiRequest("/resguardo", "POST", payload);
  return extractPayload(response);
}

export async function getResguardoByActivoId(activoId) {
  if (activoId == null || activoId === "") {
    const error = new Error("El ID del activo es obligatorio.");
    error.status = 400;
    throw error;
  }

  const payload = await apiRequest(`/resguardo/verificar/${activoId}`, "GET");
  const extracted = extractPayload(payload);

  if (Array.isArray(extracted)) {
    const normalized = normalizeResguardo(extracted[0] ?? {});
    return normalized.id_resguardo == null && normalized.activoId == null ? null : normalized;
  }

  const normalized = normalizeResguardo(extracted ?? {});
  return normalized.id_resguardo == null && normalized.activoId == null ? null : normalized;
}

export async function confirmarResguardo(formData) {
  if (!(typeof FormData !== "undefined" && formData instanceof FormData)) {
    const error = new Error("Los datos de confirmación deben enviarse como FormData.");
    error.status = 400;
    throw error;
  }

  const payload = await apiRequest("/resguardo/confirmar", "POST", formData);
  return extractPayload(payload);
}
