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

export async function getActivos() {
  const response = await apiRequest("/activo", "GET");
  return normalizeActivosList(extractActivos(response));
}

export async function deleteActivo(idActivo) {
  if (idActivo == null || idActivo === "") {
    const error = new Error("ID de activo inválido.");
    error.status = 400;
    throw error;
  }
  await apiRequest(`/activo/${idActivo}`, "DELETE");
  return { success: true };
}
