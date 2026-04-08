import { apiRequest } from "../api/apiClient";
import { normalizeActivosList } from "../utils/entityFields";

function extractActivos(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.activos)) return payload.activos;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

export async function getActivosFromService() {
  const endpoints = ["/activo", "/bien"];
  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      const response = await apiRequest(endpoint, "GET");
      return normalizeActivosList(extractActivos(response));
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error("No fue posible obtener los bienes registrados.");
}
