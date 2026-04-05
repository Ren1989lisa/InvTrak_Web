import { ROL_ID_BY_NOMBRE, ROL_NOMBRE_BY_ID, ESTATUS_USUARIO } from "../config/databaseEnums";

export function getEtiquetaBien(activo) {
  return (activo?.etiqueta_bien ?? activo?.codigo_interno ?? "").toString().trim();
}

export function normalizeActivo(a) {
  if (!a || typeof a !== "object") return a;
  const etiqueta = a.etiqueta_bien ?? a.codigo_interno;
  if (etiqueta == null || etiqueta === "") return { ...a };
  const next = { ...a, etiqueta_bien: String(etiqueta).trim() };
  if ("codigo_interno" in next) delete next.codigo_interno;
  return next;
}

export function normalizeActivosList(list) {
  if (!Array.isArray(list)) return [];
  return list.map(normalizeActivo);
}

export function getNombreUsuario(u) {
  return (u?.nombre ?? u?.nombre_completo ?? "").toString().trim();
}

export function getAreaUsuario(u) {
  return (u?.area ?? u?.departamento ?? "").toString().trim();
}

export function isUsuarioActivo(u) {
  if (u?.estatus != null) {
    return String(u.estatus).toLowerCase() === ESTATUS_USUARIO.ACTIVO;
  }
  return u?.activo === true;
}

export function normalizeUsuario(u) {
  if (!u || typeof u !== "object") return u;
  const nombre = getNombreUsuario(u);
  const area = getAreaUsuario(u);
  let rol = (u.rol ?? "").toString().toLowerCase();
  if (!rol && u.id_rol != null) {
    rol = ROL_NOMBRE_BY_ID[Number(u.id_rol)] ?? "usuario";
  }
  let id_rol = u.id_rol;
  if (id_rol == null && rol) {
    id_rol = ROL_ID_BY_NOMBRE[rol];
  }
  const estatus =
    u.estatus ??
    (u.activo === true
      ? ESTATUS_USUARIO.ACTIVO
      : u.activo === false
        ? ESTATUS_USUARIO.INACTIVO
        : ESTATUS_USUARIO.ACTIVO);
  const activoBool = String(estatus).toLowerCase() === ESTATUS_USUARIO.ACTIVO;

  return {
    ...u,
    nombre,
    nombre_completo: nombre,
    area,
    departamento: area,
    id_rol,
    rol: rol || "usuario",
    estatus,
    activo: activoBool,
  };
}

export function normalizeUsuariosList(list) {
  if (!Array.isArray(list)) return [];
  return list.map(normalizeUsuario);
}
