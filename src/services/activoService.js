import { apiRequest } from "../api/apiClient";
import { normalizeActivosList, normalizeActivo } from "../utils/entityFields";

function extractCollection(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.activos)) return payload.activos;
  if (Array.isArray(payload?.result)) return payload.result;
  return [];
}

function extractTextValue(value) {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }
  if (typeof value === "object") {
    const candidates = [
      value.nombre,
      value.name,
      value.descripcion,
      value.codigo,
      value.label,
      value.id,
    ];
    for (const candidate of candidates) {
      if (candidate != null && String(candidate).trim()) {
        return String(candidate).trim();
      }
    }
  }
  return "";
}

function normalizeId(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeProducto(item) {
  if (!item || typeof item !== "object") return item;
  return {
    ...item,
    id_producto: normalizeId(item.id_producto ?? item.idProducto ?? item.productoId ?? item.id),
    nombre: extractTextValue(item.nombre ?? item.descripcion ?? item.name ?? item.label),
  };
}

function normalizeCampus(item) {
  if (!item || typeof item !== "object") return item;
  return {
    ...item,
    id_campus: normalizeId(item.id_campus ?? item.idCampus ?? item.campusId ?? item.id),
    nombre: extractTextValue(item.nombre ?? item.descripcion ?? item.name ?? item.label),
  };
}

function normalizeEdificio(item) {
  if (!item || typeof item !== "object") return item;
  return {
    ...item,
    id_edificio: normalizeId(item.id_edificio ?? item.idEdificio ?? item.edificioId ?? item.id),
    id_campus: normalizeId(
      item.id_campus ?? item.idCampus ?? item.campusId ?? item.campus?.id ?? item.campus?.id_campus
    ),
    nombre: extractTextValue(item.nombre ?? item.descripcion ?? item.name ?? item.label),
  };
}

function normalizeAula(item) {
  if (!item || typeof item !== "object") return item;
  return {
    ...item,
    id_aula: normalizeId(item.id_aula ?? item.idAula ?? item.aulaId ?? item.id),
    id_edificio: normalizeId(
      item.id_edificio ?? item.idEdificio ?? item.edificioId ?? item.edificio?.id ?? item.edificio?.id_edificio
    ),
    nombre: extractTextValue(item.nombre ?? item.descripcion ?? item.name ?? item.label),
  };
}

function extractActivos(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.activos)) return payload.activos;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

export async function getActivos() {
  const response = await apiRequest("/activo", "GET");
  return normalizeActivosList(extractActivos(response));
}

export async function getProductos() {
  const response = await apiRequest("/producto", "GET");
  return extractCollection(response)
    .map(normalizeProducto)
    .filter((item) => item && item.id_producto != null && item.nombre);
}

export async function getCampus() {
  const response = await apiRequest("/ubicacion/campus", "GET");
  return extractCollection(response)
    .map(normalizeCampus)
    .filter((item) => item && item.id_campus != null && item.nombre);
}

export async function getEdificiosByCampus(campusId) {
  if (campusId == null || campusId === "") return [];
  const response = await apiRequest(`/ubicacion/edificio/${encodeURIComponent(campusId)}`, "GET");
  return extractCollection(response)
    .map(normalizeEdificio)
    .filter((item) => item && item.id_edificio != null && item.nombre);
}

export async function getAulasByEdificio(edificioId) {
  if (edificioId == null || edificioId === "") return [];
  const response = await apiRequest(`/ubicacion/aula/${encodeURIComponent(edificioId)}`, "GET");
  return extractCollection(response)
    .map(normalizeAula)
    .filter((item) => item && item.id_aula != null && item.nombre);
}

export async function createActivo(payload) {
  const response = await apiRequest("/activo", "POST", payload);
  const created = response?.data ?? response?.activo ?? response?.item ?? response;
  return normalizeActivo(created);
}
