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
  const fieldError =
    data?.errors?.[0]?.defaultMessage ||
    data?.errors?.[0]?.message ||
    data?.fieldErrors?.[0]?.defaultMessage ||
    data?.fieldErrors?.[0]?.message;

  return (
    data?.message ||
    data?.error ||
    fieldError ||
    fallbackMessage
  );
}

function mapRol(value) {
  const rawRole =
    value && typeof value === "object"
      ? value?.nombre ?? value?.name ?? value?.authority ?? value?.rol ?? value?.role
      : value;

  const role = (rawRole ?? "").toString().trim().toUpperCase();
  if (role === "ROLE_ADMINISTRADOR") return "admin";
  if (role === "ROLE_TECNICO") return "tecnico";
  if (role === "ROLE_USUARIO") return "usuario";
  if (role === "ADMINISTRADOR" || role === "ADMIN") return "admin";
  if (role === "TECNICO") return "tecnico";
  if (role === "USUARIO") return "usuario";
  return (rawRole ?? "").toString().trim().toLowerCase();
}

function mapFrontendRolToBackend(value) {
  const role = (value ?? "").toString().trim().toLowerCase();
  if (role === "admin") return "ROLE_ADMINISTRADOR";
  if (role === "tecnico") return "ROLE_TECNICO";
  if (role === "usuario") return "ROLE_USUARIO";
  return value;
}

function mapFrontendRolToId(value) {
  const role = (value ?? "").toString().trim().toLowerCase();
  if (role === "admin") return 1;
  if (role === "usuario") return 2;
  if (role === "tecnico") return 3;
  return null;
}

function normalizeUsuario(raw = {}) {
  return {
    ...raw,
    id_usuario: raw?.id_usuario ?? raw?.idUsuario ?? raw?.id ?? null,
    nombre: raw?.nombre ?? raw?.nombreCompleto ?? raw?.nombre_completo ?? "",
    nombre_completo: raw?.nombreCompleto ?? raw?.nombre_completo ?? raw?.nombre ?? "",
    correo: raw?.correo ?? raw?.email ?? "",
    numero_empleado: raw?.numero_empleado ?? raw?.numeroEmpleado ?? "",
    area: raw?.area ?? raw?.departamento ?? "",
    curp: raw?.curp ?? "",
    fecha_nacimiento: raw?.fecha_nacimiento ?? raw?.fechaNacimiento ?? "",
    rol: mapRol(raw?.rol ?? raw?.role),
  };
}

function extractList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.usuarios)) return payload.usuarios;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

async function authGet(endpoint, defaultMessage) {
  const token = getStoredToken();
  if (!token) {
    const error = new Error("No hay sesión activa.");
    error.status = 401;
    throw error;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await parseJsonSafe(response);
  if (!response.ok) {
    const error = new Error(getBackendErrorMessage(data, defaultMessage));
    error.status = response.status;
    throw error;
  }

  return data;
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

export async function getPerfilActual() {
  return authGet("/usuario/me", "No fue posible obtener el perfil.");
}

export async function getUsuarios() {
  const endpoints = ["/usuario", "/usuarios"];
  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      const data = await authGet(endpoint, "No fue posible obtener los usuarios.");
      return extractList(data).map(normalizeUsuario);
    } catch (error) {
      lastError = error;
      if (error?.status !== 404) break;
    }
  }

  throw lastError ?? new Error("No fue posible obtener los usuarios.");
}

export async function getUsuarioById(idUsuario) {
  if (idUsuario == null || idUsuario === "") {
    const error = new Error("ID de usuario invalido.");
    error.status = 400;
    throw error;
  }

  const data = await authGet(
    `/usuario/${encodeURIComponent(idUsuario)}`,
    "No fue posible obtener el usuario."
  );

  return normalizeUsuario(data?.data ?? data?.usuario ?? data);
}

export async function createUsuario(input) {
  const rolId = mapFrontendRolToId(input?.rol);
  const payload = {
    nombre: input?.nombre ?? "",
    correo: input?.correo ?? "",
    fechaNacimiento: input?.fecha_nacimiento ?? input?.fechaNacimiento ?? "",
    curp: input?.curp ?? "",
    numeroEmpleado: input?.numero_empleado ?? input?.numeroEmpleado ?? "",
    area: input?.area ?? "",
    rolId,
    rol: mapFrontendRolToBackend(input?.rol),
    password: input?.password ?? input?.numero_empleado ?? input?.numeroEmpleado ?? "",
  };

  const endpoints = ["/usuario", "/usuarios"];
  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      const data = await authRequest(
        "POST",
        endpoint,
        payload,
        "No fue posible registrar el usuario."
      );
      return normalizeUsuario(data?.data ?? data?.usuario ?? data);
    } catch (error) {
      lastError = error;
      if (error?.status !== 404) break;
    }
  }

  throw lastError ?? new Error("No fue posible registrar el usuario.");
}

export async function updateUsuarioPassword(idUsuario, password) {
  if (idUsuario == null) {
    const error = new Error("ID de usuario inválido.");
    error.status = 400;
    throw error;
  }

  const data = await authRequest(
    "PUT",
    `/usuario/${idUsuario}`,
    { password: password ?? "" },
    "No fue posible actualizar el usuario."
  );

  return normalizeUsuario(data?.data ?? data?.usuario ?? data);
}

export async function updateUsuario(idUsuario, input) {
  if (idUsuario == null || idUsuario === "") {
    const error = new Error("ID de usuario invalido.");
    error.status = 400;
    throw error;
  }

  const payload = {
    nombre: (input?.nombre ?? "").toString().trim(),
    correo: (input?.correo ?? "").toString().trim(),
    fechaNacimiento: input?.fecha_nacimiento ?? input?.fechaNacimiento ?? "",
    curp: (input?.curp ?? "").toString().trim().toUpperCase(),
    numeroEmpleado: (input?.numero_empleado ?? input?.numeroEmpleado ?? "").toString().trim(),
    rolId:
      input?.rolId ??
      mapFrontendRolToId(input?.rol),
    area: (input?.area ?? input?.departamento ?? "").toString().trim(),
  };

  const data = await authRequest(
    "PUT",
    `/usuario/${encodeURIComponent(idUsuario)}`,
    payload,
    "No fue posible actualizar el usuario."
  );

  return normalizeUsuario(data?.data ?? data?.usuario ?? data);
}

export async function deleteUsuario(idUsuario) {
  if (idUsuario == null) {
    const error = new Error("ID de usuario inválido.");
    error.status = 400;
    throw error;
  }

  await authRequest(
    "DELETE",
    `/usuario/${idUsuario}`,
    null,
    "No fue posible eliminar el usuario."
  );

  return { success: true };
}
