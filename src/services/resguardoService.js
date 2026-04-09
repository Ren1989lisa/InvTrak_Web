import { API_BASE_URL } from "../api/apiClient";

function getStoredToken() {
  return (
    window.localStorage.getItem("invtrack_auth_token") ||
    window.localStorage.getItem("token") ||
    null
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
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401) {
    const error = new Error("Sesión expirada.");
    error.status = 401;
    throw error;
  }

  if (!response.ok) {
    let data;
    try {
      data = await response.json();
    } catch {
      data = null;
    }
    const message =
      data?.message ||
      data?.error ||
      data?.errors?.[0]?.defaultMessage ||
      defaultMessage ||
      "Error en la operación.";
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Crea una asignación de resguardo (asigna un bien a un usuario)
 * @param {Object} input - Datos de la asignación
 * @param {number} input.activoId - ID del activo a asignar
 * @param {number} input.usuarioId - ID del usuario receptor
 * @param {string} [input.observaciones] - Observaciones opcionales
 * @returns {Promise<Object>} El resguardo creado con su ID
 */
export async function createResguardo(input) {
  if (!input?.activoId) {
    const error = new Error("El ID del activo es obligatorio.");
    error.status = 400;
    throw error;
  }

  if (!input?.usuarioId) {
    const error = new Error("El ID del usuario es obligatorio.");
    error.status = 400;
    throw error;
  }

  const payload = {
    activoId: Number(input.activoId),
    usuarioId: Number(input.usuarioId),
    observaciones: input.observaciones ?? "",
  };

  const data = await authRequest(
    "POST",
    "/resguardo",
    payload,
    "No fue posible crear la asignación."
  );

  return data;
}

/**
 * Obtiene todos los resguardos
 * @returns {Promise<Array>} Lista de resguardos
 */
export async function getResguardos() {
  const data = await authRequest(
    "GET",
    "/resguardo",
    null,
    "No fue posible obtener los resguardos."
  );

  return Array.isArray(data) ? data : (data?.data ?? data?.resguardos ?? []);
}
