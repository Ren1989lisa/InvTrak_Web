import { useMemo } from "react";
import { getStoredActivos } from "../activosStorage";
import { getStoredResguardos } from "../resguardosStorage";

export function usePendientesResguardo(currentUser) {
  const activos = useMemo(() => getStoredActivos(), []);
  const resguardos = useMemo(() => getStoredResguardos(), []);

  const isUsuario = (currentUser?.rol ?? "").toString().toLowerCase() === "usuario";

  const misBienes = useMemo(() => {
    if (!isUsuario) return [];
    const idUsuario = Number(currentUser?.id_usuario);
    const idsDesdeResguardos = new Set(
      resguardos
        .filter((r) => Number(r?.id_usuario) === idUsuario)
        .map((r) => Number(r?.id_activo))
    );
    return activos.filter(
      (a) =>
        Number(a?.id_usuario_asignado) === idUsuario ||
        idsDesdeResguardos.has(Number(a?.id_activo))
    );
  }, [activos, resguardos, currentUser?.id_usuario, isUsuario]);

  return useMemo(() => {
    if (!isUsuario) return [];
    const pendiente = (v) =>
      (v ?? "").toString().toLowerCase().includes("pendiente");
    return misBienes
      .filter((a) => pendiente(a?.estado_asignacion))
      .map((a) => ({
        ...a,
        productoNombre:
          a?.producto?.tipo_activo ?? a?.tipo_activo ?? a?.producto?.modelo ?? "—",
      }));
  }, [misBienes, isUsuario]);
}
