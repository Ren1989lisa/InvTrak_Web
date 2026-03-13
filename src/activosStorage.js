import activosSeed from "./Data/activosDetalle.json";

const STORAGE_KEY = "invtrack_activos";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function sanitizeActivos(list) {
  return Array.isArray(list) ? list : [];
}

export function getStoredActivos() {
  if (!canUseStorage()) return sanitizeActivos(activosSeed);

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = sanitizeActivos(activosSeed);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("Formato inválido de activos");
    return parsed;
  } catch {
    const seed = sanitizeActivos(activosSeed);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
}

export function saveActivos(list) {
  const safe = sanitizeActivos(list);
  if (!canUseStorage()) return safe;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
  return safe;
}

export function addActivo(activo) {
  const current = getStoredActivos();
  const next = [...current, activo];
  saveActivos(next);
  return next;
}
