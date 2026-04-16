import { apiRequest } from "./api";
import { normalizeActivo, normalizeUsuario as normalizeEntityUsuario } from "../utils/entityFields";

export const RESGUARDOS_CHANGED_EVENT = "invtrack-resguardos-changed";

function dispatchResguardosChanged(detail = {}) {
  if (typeof window === "undefined" || typeof window.dispatchEvent !== "function") return;
  window.dispatchEvent(
    new CustomEvent(RESGUARDOS_CHANGED_EVENT, {
      detail: {
        ...detail,
        at: Date.now(),
      },
    })
  );
}

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
  if (typeof payload === "string") {
    const text = payload.trim();
    if (text) {
      try {
        return JSON.parse(text);
      } catch {
        return payload;
      }
    }
    return payload;
  }

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
    data.confirmados,
    data.pendientes,
    data.registros,
    data.rows,
  ];

  const mergedLists = [];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      mergedLists.push(...candidate);
    }
  }

  if (mergedLists.length > 0) {
    return mergedLists;
  }

  // Fallback: detectar cualquier propiedad array con objetos "tipo resguardo".
  for (const value of Object.values(data)) {
    if (!Array.isArray(value) || value.length === 0) continue;
    const first = value[0];
    if (first && typeof first === "object") {
      return value;
    }
  }

  const singleResguardoCandidate =
    data.resguardo && typeof data.resguardo === "object" && !Array.isArray(data.resguardo)
      ? data.resguardo
      : data.item && typeof data.item === "object" && !Array.isArray(data.item)
        ? data.item
        : data;

  if (
    singleResguardoCandidate &&
    typeof singleResguardoCandidate === "object" &&
    (
      singleResguardoCandidate.id_resguardo != null ||
      singleResguardoCandidate.idResguardo != null ||
      singleResguardoCandidate.resguardoId != null ||
      singleResguardoCandidate.id != null ||
      singleResguardoCandidate.activoId != null ||
      singleResguardoCandidate.id_activo != null ||
      singleResguardoCandidate.idActivo != null ||
      singleResguardoCandidate.confirmado != null ||
      singleResguardoCandidate.estado_resguardo != null ||
      singleResguardoCandidate.estadoResguardo != null ||
      singleResguardoCandidate.activo != null
    )
  ) {
    return [singleResguardoCandidate];
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

function hasOwn(source, key) {
  return Object.prototype.hasOwnProperty.call(source, key);
}

function normalizeNullableDate(value) {
  const text = normalizeText(value);
  if (!text) return null;

  const normalized = text.toLowerCase();
  if (
    ["null", "undefined", "n/a", "na", "sin devolucion", "sin devolución", "-", "--"].includes(normalized)
  ) {
    return null;
  }

  if (
    normalized.startsWith("0000-00-00") ||
    normalized.startsWith("0001-01-01") ||
    normalized.startsWith("1900-01-01") ||
    normalized.startsWith("1970-01-01")
  ) {
    return null;
  }

  return text;
}

function hasMeaningfulValue(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "boolean") return value === true;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "string") {
    const text = value.trim().toLowerCase();
    return text !== "" && text !== "null" && text !== "undefined" && text !== "n/a";
  }
  return true;
}

function isChecklistEnumLikeValue(value) {
  const text = normalizeText(value).toUpperCase();
  return text === "SI" || text === "NO";
}

export function normalizeResguardo(raw = {}) {
  const source = raw && typeof raw === "object" ? raw : {};
  const checklistSource =
    source.checklists ??
    source.checklist ??
    source.checklistResguardo ??
    source.checklist_resguardo ??
    source.detalleChecklist ??
    source.detalle_checklist ??
    {};
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

  const explicitConfirmValue =
    source.confirmado ??
    source.confirmada ??
    source.confirmed ??
    source.estadoConfirmacion ??
    source.estado_confirmacion;
  const hasExplicitConfirm =
    hasOwn(source, "confirmado") ||
    hasOwn(source, "confirmada") ||
    hasOwn(source, "confirmed") ||
    hasOwn(source, "estadoConfirmacion") ||
    hasOwn(source, "estado_confirmacion");

  const fechaDevolucion = normalizeNullableDate(
    source.fechaDevolucion ?? source.fecha_devolucion
  );
  const fechaConfirmacion = normalizeNullableDate(
    source.fechaConfirmacion ?? source.fecha_confirmacion
  );
  const fechaAsignacion =
    source.fechaAsignacion ??
    source.fecha_asignacion ??
    source.fechaCreacion ??
    source.fecha_creacion ??
    source.asignadoEn ??
    source.createdAt ??
    null;
  const observaciones = normalizeText(
    source.observaciones ?? source.observacion ?? source.comentarios ?? ""
  );

  const estadoResguardo = normalizeText(
    source.estadoResguardo ??
      source.estado_resguardo ??
      source.estatusResguardo ??
      source.estatus_resguardo ??
      source.estado ??
      source.estatus
  ).toLowerCase();

  const hasChecklistData = [
    source.enciende,
    source.pantallaFunciona,
    source.tieneCargador,
    source.danios,
    checklistSource?.enciende,
    checklistSource?.pantallaFunciona,
    checklistSource?.tieneCargador,
    checklistSource?.danios,
    checklistSource?.pantalla_funciona,
    checklistSource?.tiene_cargador,
  ].some(isChecklistEnumLikeValue);

  const hasChecklistRecord =
    [
      source.idChecklistResguardo,
      source.id_checklist_resguardo,
      source.idChecklist,
      source.id_checklist,
      source.checklistId,
      checklistSource?.id,
      checklistSource?.idChecklistResguardo,
      checklistSource?.id_checklist_resguardo,
      checklistSource?.idChecklist,
      checklistSource?.id_checklist,
      source.checklists ? 1 : null,
    ].some(hasMeaningfulValue);

  const inferredConfirmed =
    Boolean(fechaConfirmacion) ||
    estadoResguardo.includes("confirmad") ||
    estadoResguardo.includes("resguardad") ||
    hasChecklistRecord ||
    hasChecklistData;

  const confirmedByValue =
    explicitConfirmValue == null ? false : normalizeBoolean(explicitConfirmValue);
  const confirmado = (hasExplicitConfirm ? confirmedByValue : false) || inferredConfirmed;

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
    checklists:
      checklistSource && typeof checklistSource === "object" && Object.keys(checklistSource).length > 0
        ? checklistSource
        : null,
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
    resguardo_id: item.resguardoId ?? item.id_resguardo ?? null,
    fecha_asignacion: item.fechaAsignacion ?? null,
    estado_asignacion: item.confirmado === true ? "confirmado" : "pendiente de confirmacion",
    estatus: item.confirmado === true ? "RESGUARDADO" : (normalizeText(activo?.estatus).toUpperCase() || "DISPONIBLE"),
  };
}

export async function getResguardos(requestOptions = {}) {
  const payload = await apiRequest("/resguardo", "GET", null, {}, requestOptions);

  if (typeof payload === "string") {
    const text = payload.trim();
    if (!text) return [];

    try {
      const parsed = JSON.parse(text);
      return extractList(parsed).map(normalizeResguardo);
    } catch {
      const error = new Error(
        "El backend devolvió una respuesta inválida para /api/resguardo. Revisa serialización JSON en Spring Boot."
      );
      error.status = 500;
      throw error;
    }
  }

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
  const created = extractPayload(response);
  dispatchResguardosChanged({
    type: "assigned",
    activoId: payload.activoId,
    usuarioId: payload.usuarioId,
  });
  return created;
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
  const confirmed = extractPayload(payload);
  dispatchResguardosChanged({
    type: "confirmed",
    resguardoId:
      confirmed?.resguardoId ??
      confirmed?.id_resguardo ??
      confirmed?.id ??
      null,
    activoId:
      confirmed?.activoId ??
      confirmed?.id_activo ??
      confirmed?.activo?.id_activo ??
      null,
  });
  return confirmed;
}

export async function deleteResguardo(resguardoId) {
  const id = Number(resguardoId);
  if (!Number.isFinite(id) || id <= 0) {
    const error = new Error("El ID del resguardo es obligatorio.");
    error.status = 400;
    throw error;
  }

  await apiRequest(`/resguardo/${encodeURIComponent(id)}`, "DELETE");
  dispatchResguardosChanged({
    type: "deleted",
    resguardoId: id,
  });
}

export async function solicitarDevolucionPorActivo(
  activoId,
  observaciones = "Solicitud de devolucion desde web."
) {
  const targetActivoId = Number(activoId);
  if (!Number.isFinite(targetActivoId) || targetActivoId <= 0) {
    const error = new Error("El ID del activo es obligatorio.");
    error.status = 400;
    throw error;
  }

  const resguardos = await getResguardos();
  const target = (Array.isArray(resguardos) ? resguardos : [])
    .map(normalizeResguardo)
    .find((item) => {
      const itemActivoId = Number(
        item?.activoId ?? item?.id_activo ?? item?.activo?.id_activo ?? item?.activo?.idActivo
      );
      const fechaDevolucion = normalizeNullableDate(item?.fechaDevolucion);
      return itemActivoId === targetActivoId && item?.confirmado === true && !fechaDevolucion;
    });

  if (!target) {
    const error = new Error("No se encontro un resguardo confirmado para este activo.");
    error.status = 404;
    throw error;
  }

  const resguardoId = target?.resguardoId ?? target?.id_resguardo;
  if (resguardoId == null) {
    const error = new Error("No se encontro el resguardo asociado al activo.");
    error.status = 404;
    throw error;
  }

  const payload = await apiRequest(`/resguardo/${encodeURIComponent(resguardoId)}`, "PUT", {
    estado: "DEVOLUCION",
    observaciones,
  });

  const updated = normalizeResguardo(extractPayload(payload));
  dispatchResguardosChanged({
    type: "return_requested",
    resguardoId: updated?.resguardoId ?? resguardoId,
    activoId: updated?.activoId ?? targetActivoId,
  });
  return updated;
}
