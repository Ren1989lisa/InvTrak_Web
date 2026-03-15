import resguardosSeed from "./Data/resguardos.json";

const STORAGE_KEY = "invtrack_resguardos";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function sanitizeResguardos(list) {
  return Array.isArray(list) ? list : [];
}

export function getStoredResguardos() {
  if (!canUseStorage()) return sanitizeResguardos(resguardosSeed);

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = sanitizeResguardos(resguardosSeed);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("Formato inválido de resguardos");
    return parsed;
  } catch {
    const seed = sanitizeResguardos(resguardosSeed);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
}

export function saveResguardos(list) {
  const safe = sanitizeResguardos(list);
  if (!canUseStorage()) return safe;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
  return safe;
}

export function addResguardo(resguardo) {
  const current = getStoredResguardos();
  const next = [...current, resguardo];
  saveResguardos(next);
  return next;
}
