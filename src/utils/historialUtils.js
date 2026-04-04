export function formatHistorialDate(value) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}

export function formatEstatusLabel(raw) {
  const s = (raw ?? "").toString().trim().toUpperCase();
  const map = {
    MANTENIMIENTO: "En mantenimiento",
    DISPONIBLE: "Disponible",
    RESGUARDADO: "Resguardado",
    BAJA: "Baja",
  };
  return map[s] || raw || "—";
}

export function eventTitle(tipo) {
  switch (tipo) {
    case "cambio_estatus":
      return "Cambio de Estatus";
    case "mantenimiento":
      return "Mantenimiento";
    case "asignacion":
      return "Asignación de técnico";
    case "reporte":
      return "Reporte";
    default:
      return "Evento";
  }
}
