export const ESTATUS_ACTIVO = {
  RESGUARDADO: "RESGUARDADO",
  DISPONIBLE: "DISPONIBLE",
  MANTENIMIENTO: "MANTENIMIENTO",
  BAJA: "BAJA",
};

export const ESTATUS_ACTIVO_OPTIONS = [
  { value: ESTATUS_ACTIVO.DISPONIBLE, label: "Disponible" },
  { value: ESTATUS_ACTIVO.RESGUARDADO, label: "Resguardado" },
  { value: ESTATUS_ACTIVO.MANTENIMIENTO, label: "Mantenimiento" },
  { value: ESTATUS_ACTIVO.BAJA, label: "Baja" },
];

export function getEstadoDisplay(activo) {
  const assignmentState = (activo?.estado_asignacion ?? "").toString().trim().toLowerCase();
  const assetStatus = (activo?.estatus ?? "").toString().trim();

  if (assignmentState === "pendiente de confirmacion") {
    return "DISPONIBLE";
  }

  if (assignmentState === "confirmado" || assignmentState === "resguardado") {
    return assetStatus || "RESGUARDADO";
  }

  return assetStatus || "DISPONIBLE";
}
