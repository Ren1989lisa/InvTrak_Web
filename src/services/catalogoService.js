import { API_BASE_URL } from "../api/apiClient";

function getStoredToken() {
  return (
    window.localStorage.getItem("invtrack_auth_token") ||
    window.localStorage.getItem("token") ||
    null
  );
}

async function parseJsonSafe(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function getBackendErrorMessage(data, fallbackMessage) {
  return (
    data?.message ||
    data?.error ||
    data?.errors?.[0]?.defaultMessage ||
    data?.fieldErrors?.[0]?.defaultMessage ||
    fallbackMessage
  );
}

async function authRequest(method, endpoint, body, defaultMessage) {
  const token = getStoredToken();
  if (!token) {
    const error = new Error("No hay sesión activa.");
    error.status = 401;
    throw error;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body == null ? undefined : JSON.stringify(body),
  });

  const data = await parseJsonSafe(response);
  if (!response.ok) {
    const error = new Error(getBackendErrorMessage(data, defaultMessage));
    error.status = response.status;
    throw error;
  }

  return data;
}

// ==================== PRODUCTOS ====================

function normalizeProducto(raw) {
  if (!raw || typeof raw !== "object") return raw;

  const modelo = raw.modelo ?? {};
  const marca = modelo.marca ?? {};

  // Normalizar estatus: ACTIVO/INACTIVO del backend → Activo/Inactivo del frontend
  let estatusNormalizado = "Activo"; // Por defecto siempre Activo
  
  if (raw.estatus != null && raw.estatus !== "") {
    const estatusUpper = String(raw.estatus).toUpperCase().trim();
    
    // Solo marcar como Inactivo si explícitamente dice INACTIVO
    if (estatusUpper === "INACTIVO" || estatusUpper === "INACTIVE") {
      estatusNormalizado = "Inactivo";
    }
  }

  return {
    id_producto: raw.id_producto ?? raw.idProducto ?? null,
    nombre: raw.nombre ?? "",
    descripcion: raw.descripcion ?? "",
    estatus: estatusNormalizado,
    id_modelo: modelo.id_modelo ?? modelo.idModelo ?? null,
    modelo: modelo.nombre ?? "",
    id_marca: marca.id_marca ?? marca.idMarca ?? null,
    marca: marca.nombre ?? "",
  };
}

export async function getProductos() {
  const data = await authRequest("GET", "/producto", null, "No fue posible obtener los productos.");
  const list = Array.isArray(data) ? data : (data?.data ?? data?.productos ?? []);
  return list.map(normalizeProducto);
}

export async function createProducto(input) {
  const descripcionValue = (input?.descripcion ?? "").trim();
  if (!descripcionValue) {
    const error = new Error("La descripción es obligatoria.");
    error.status = 400;
    throw error;
  }

  const payload = {
    nombre: input?.nombre ?? "",
    marcaNombre: input?.marca ?? "",
    modeloNombre: input?.modelo ?? "",
    descripcion: descripcionValue,
    estatus: "ACTIVO",
  };

  const data = await authRequest(
    "POST",
    "/producto",
    payload,
    "No fue posible crear el producto."
  );

  return normalizeProducto(data?.data ?? data);
}

export async function updateProducto(idProducto, input) {
  if (idProducto == null) {
    const error = new Error("ID de producto inválido.");
    error.status = 400;
    throw error;
  }

  const descripcionValue = (input?.descripcion ?? "").trim();
  if (!descripcionValue) {
    const error = new Error("La descripción es obligatoria.");
    error.status = 400;
    throw error;
  }

  const payload = {
    descripcion: descripcionValue,
    estatus: input?.estatus === "Activo" ? "ACTIVO" : "INACTIVO",
  };

  const data = await authRequest(
    "PUT",
    `/producto/${idProducto}`,
    payload,
    "No fue posible actualizar el producto."
  );

  return normalizeProducto(data?.data ?? data);
}

export async function deleteProducto(idProducto) {
  if (idProducto == null) {
    const error = new Error("ID de producto inválido.");
    error.status = 400;
    throw error;
  }

  await authRequest(
    "DELETE",
    `/producto/${idProducto}`,
    null,
    "No fue posible eliminar el producto."
  );

  return { success: true };
}

// ==================== UBICACIONES ====================

function normalizeUbicacion(raw) {
  if (!raw || typeof raw !== "object") return raw;

  const edificio = raw.edificio ?? {};
  const campus = edificio.campus ?? {};

  return {
    id_ubicacion: raw.idAula ?? raw.id_ubicacion ?? raw.id ?? null,
    aula: raw.nombre ?? raw.aula ?? "",
    edificio: edificio.nombre ?? "",
    campus: campus.nombre ?? "",
    descripcion: raw.descripcion ?? "",
    id_edificio: edificio.idEdificio ?? edificio.id_edificio ?? null,
    id_campus: campus.idCampus ?? campus.id_campus ?? null,
  };
}

export async function getUbicaciones() {
  const data = await authRequest("GET", "/ubicacion", null, "No fue posible obtener las ubicaciones.");
  const list = Array.isArray(data) ? data : (data?.data ?? data?.ubicaciones ?? data?.aulas ?? []);
  return list.map(normalizeUbicacion);
}

export async function createUbicacion(input) {
  const payload = {
    campusNombre: input?.campus ?? "",
    edificioNombre: input?.edificio ?? "",
    aulaNombre: input?.aula ?? "",
    descripcion: (input?.descripcion ?? "").trim() || null,
  };

  const data = await authRequest(
    "POST",
    "/ubicacion",
    payload,
    "No fue posible crear la ubicación."
  );

  return normalizeUbicacion(data?.data ?? data);
}

export async function updateUbicacion(idUbicacion, input) {
  if (idUbicacion == null) {
    const error = new Error("ID de ubicación inválido.");
    error.status = 400;
    throw error;
  }

  const payload = {
    descripcion: input?.descripcion ?? "",
  };

  const data = await authRequest(
    "PUT",
    `/ubicacion/${idUbicacion}`,
    payload,
    "No fue posible actualizar la ubicación."
  );

  return normalizeUbicacion(data?.data ?? data);
}

export async function deleteUbicacion(idUbicacion) {
  if (idUbicacion == null) {
    const error = new Error("ID de ubicación inválido.");
    error.status = 400;
    throw error;
  }

  await authRequest(
    "DELETE",
    `/ubicacion/${idUbicacion}`,
    null,
    "No fue posible eliminar la ubicación."
  );

  return { success: true };
}
