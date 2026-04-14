import { ApiError, normalizeApiBaseUrl } from "../api/apiClient";
import { getToken as getStoredToken } from "./authService";

function resolveToken(token) {
  if (token !== undefined) {
    return token;
  }

  return getStoredToken();
}

function normalizeActivoId(activoId) {
  if (activoId === null || activoId === undefined) {
    throw new ApiError("ID de activo inválido", 400);
  }

  const value = String(activoId).trim();
  if (!value) {
    throw new ApiError("ID de activo inválido", 400);
  }

  return value;
}

export function buildActivoQrUrl(activoId, baseUrl) {
  const apiBaseUrl = normalizeApiBaseUrl(baseUrl);
  const id = normalizeActivoId(activoId);
  return `${apiBaseUrl}/qr/${encodeURIComponent(id)}`;
}

export async function fetchActivoQrBlob(activoId, options = {}) {
  const { baseUrl, token, signal } = options;
  const url = buildActivoQrUrl(activoId, baseUrl);
  const resolvedToken = resolveToken(token);
  const headers = {};

  if (typeof resolvedToken === "string" && resolvedToken.trim()) {
    headers.Authorization = `Bearer ${resolvedToken.trim()}`;
  }

  let response;
  try {
    response = await fetch(url, {
      method: "GET",
      headers,
      signal,
    });
  } catch (error) {
    throw new ApiError("Error de red", 0, error);
  }

  if (!response.ok) {
    const status = response.status;
    let message = "No se pudo cargar el QR";

    if (status === 401) {
      message = "No autorizado";
    } else if (status === 404) {
      message = "QR no encontrado";
    }

    throw new ApiError(message, status, null);
  }

  const blob = await response.blob();
  if (!blob || blob.size === 0) {
    throw new ApiError("El QR llegó vacío", response.status, null);
  }

  return blob;
}
