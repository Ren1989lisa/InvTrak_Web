import reportesSeed from "./Data/reportes.json";

const STORAGE_KEY = "invtrack_reportes";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function sanitizeReportes(list) {
  return Array.isArray(list) ? list : [];
}

export function getStoredReportes() {
  if (!canUseStorage()) return sanitizeReportes(reportesSeed);

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = sanitizeReportes(reportesSeed);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error("Formato inválido de reportes");
    return parsed;
  } catch {
    const seed = sanitizeReportes(reportesSeed);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
}

export function saveReportes(list) {
  const safe = sanitizeReportes(list);
  if (!canUseStorage()) return safe;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
  return safe;
}

export function assignTecnicoToReporte(idReporte, idTecnico) {
  const reportes = getStoredReportes();
  const updated = reportes.map((r) =>
    Number(r?.id_reporte) === Number(idReporte)
      ? { ...r, id_tecnico_asignado: Number(idTecnico), estatus: "asignado" }
      : r
  );
  saveReportes(updated);
  return updated;
}
