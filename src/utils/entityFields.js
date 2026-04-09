import { ROL_ID_BY_NOMBRE, ROL_NOMBRE_BY_ID, ESTATUS_USUARIO } from "../config/databaseEnums";

function normalizeTextValue(value) {
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
      value.id,
      value.idCampus,
      value.idEdificio,
      value.idAula,
    ];
    for (const candidate of candidates) {
      if (candidate != null && candidate !== "") return String(candidate).trim();
    }
  }
  return "";
}

export function getEtiquetaBien(activo) {
  return (activo?.etiqueta_bien ?? activo?.codigo_interno ?? "").toString().trim();
}

export function normalizeActivo(a) {
  if (!a || typeof a !== "object") return a;
  const idActivo = a.id_activo ?? a.idActivo ?? a.id ?? null;
  const etiqueta = a.etiqueta_bien ?? a.etiquetaBien ?? a.codigo_interno ?? "";
  const numeroSerie = a.numero_serie ?? a.numeroSerie ?? a.serie ?? "";
  
  // Extraer ubicación desde estructura anidada
  let campus = "";
  let edificio = "";
  let aula = "";
  let ubicacionCompleta = "";
  
  if (a.aula && typeof a.aula === "object") {
    // Estructura anidada del backend: aula.edificio.campus
    aula = a.aula.nombre ?? "";
    if (a.aula.edificio && typeof a.aula.edificio === "object") {
      edificio = a.aula.edificio.nombre ?? "";
      if (a.aula.edificio.campus && typeof a.aula.edificio.campus === "object") {
        campus = a.aula.edificio.campus.nombre ?? "";
      }
    }
    // Concatenar ubicación completa: "UTEZ Edificio A Lab 1"
    ubicacionCompleta = [campus, edificio, aula].filter(Boolean).join(" ");
  } else {
    // Fallback para estructura plana o anterior
    const rawUbicacion = a.ubicacion ?? {};
    campus = normalizeTextValue(rawUbicacion.campus ?? a.campus);
    edificio = normalizeTextValue(rawUbicacion.edificio ?? a.edificio);
    aula = normalizeTextValue(rawUbicacion.aula ?? a.aula);
    ubicacionCompleta = [campus, edificio, aula].filter(Boolean).join(" ");
  }

  const ubicacion = {
    campus,
    edificio,
    aula,
    completa: ubicacionCompleta,
  };

  // Extraer producto desde estructura anidada
  let nombreProducto = "";
  let marcaProducto = "";
  let modeloProducto = "";
  let tipoActivo = "";
  let productoCompleto = "";

  if (a.producto && typeof a.producto === "object") {
    // Estructura anidada del backend: producto.modelo.marca
    nombreProducto = a.producto.nombre ?? "";
    tipoActivo = a.producto.tipo_activo ?? a.producto.tipoActivo ?? "";
    
    if (a.producto.modelo && typeof a.producto.modelo === "object") {
      modeloProducto = a.producto.modelo.nombre ?? "";
      if (a.producto.modelo.marca && typeof a.producto.modelo.marca === "object") {
        marcaProducto = a.producto.modelo.marca.nombre ?? "";
      }
    }
    // Concatenar producto completo: "Laptop HP Pavilion HP"
    productoCompleto = [nombreProducto, modeloProducto, marcaProducto].filter(Boolean).join(" ");
  } else {
    // Fallback para estructura anterior
    tipoActivo = a.tipo_activo ?? a.tipoActivo ?? "";
    marcaProducto = a.marca ?? "";
    modeloProducto = a.modelo ?? "";
    nombreProducto = "";
    productoCompleto = [nombreProducto, modeloProducto, marcaProducto].filter(Boolean).join(" ");
  }

  const producto = {
    nombre: nombreProducto,
    tipo_activo: tipoActivo,
    marca: marcaProducto,
    modelo: modeloProducto,
    completo: productoCompleto,
  };

  const costo = a.costo ?? a.valor ?? 0;
  const fechaAlta = a.fecha_alta ?? a.fechaAlta ?? "";

  const next = {
    ...a,
    id_activo: idActivo,
    etiqueta_bien: String(etiqueta).trim(),
    numero_serie: numeroSerie,
    tipo_activo: tipoActivo,
    marca: marcaProducto,
    modelo: modeloProducto,
    costo,
    fecha_alta: fechaAlta,
    ubicacion,
    producto,
    propietario: a.propietario ?? a.responsable ?? "",
    estatus: a.estatus ?? a.estado ?? "",
  };
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
