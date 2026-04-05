import activosSeed from "./Data/activosDetalle.json";
import { normalizeActivosList, normalizeActivo } from "./utils/entityFields";

const STORAGE_KEY = "invtrack_activos";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function sanitizeActivos(list) {
  return Array.isArray(list) ? list : [];
}

export function getStoredActivos() {
  if (!canUseStorage()) return normalizeActivosList(sanitizeActivos(activosSeed));

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = normalizeActivosList(sanitizeActivos(activosSeed));
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("Formato inválido de activos");
    return normalizeActivosList(parsed);
  } catch {
    const seed = normalizeActivosList(sanitizeActivos(activosSeed));
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
}

export function saveActivos(list) {
  const safe = normalizeActivosList(sanitizeActivos(list));
  if (!canUseStorage()) return safe;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
  return safe;
}

export function addActivo(activo) {
  const current = getStoredActivos();
  const next = [...current, normalizeActivo(activo)];
  saveActivos(next);
  return next;
}
