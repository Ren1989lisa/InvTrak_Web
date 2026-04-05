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

export const ESTADO_RESGUARDO = {
  PENDIENTE_ASIGNACION: "pendiente de asignacion",
  PENDIENTE_CONFIRMACION: "pendiente de confirmacion",
  CONFIRMADO: "confirmado",
};

export const ESTATUS_REPORTE_DANIO = {
  PENDIENTE: "pendiente",
  ASIGNADO: "asignado",
  EN_PROCESO: "en_proceso",
  EN_MANTENIMIENTO: "en_mantenimiento",
  RESUELTO: "resuelto",
};

export const ESTATUS_MANTENIMIENTO = {
  PENDIENTE: "pendiente",
  EN_PROCESO: "en_proceso",
  EN_MANTENIMIENTO: "en_mantenimiento",
  RESUELTO: "resuelto",
};

export const PRIORIDAD = {
  ALTA: "alta",
  MEDIA: "media",
  BAJA: "baja",
};

export const TIPO_EVENTO_HISTORIAL = {
  CAMBIO_ESTATUS: "cambio_estatus",
  MANTENIMIENTO: "mantenimiento",
  ASIGNACION: "asignacion",
  REPORTE: "reporte",
};

export const ESTATUS_USUARIO = {
  ACTIVO: "activo",
  INACTIVO: "inactivo",
};

export const ROL_ID_BY_NOMBRE = {
  admin: 1,
  usuario: 2,
  tecnico: 3,
};

export const ROL_NOMBRE_BY_ID = {
  1: "admin",
  2: "usuario",
  3: "tecnico",
};

export function getEstadoDisplay(activo) {
  const assignmentState = (activo?.estado_asignacion ?? "").toString().trim().toLowerCase();
  const assetStatus = (activo?.estatus ?? "").toString().trim();

  if (assignmentState === ESTADO_RESGUARDO.PENDIENTE_CONFIRMACION) {
    return "DISPONIBLE";
  }

  if (assignmentState === ESTADO_RESGUARDO.CONFIRMADO || assignmentState === "resguardado") {
    return assetStatus || ESTATUS_ACTIVO.RESGUARDADO;
  }

  return assetStatus || ESTATUS_ACTIVO.DISPONIBLE;
}
