import { useCallback, useEffect, useMemo, useState } from "react";
import {
  RESGUARDOS_CHANGED_EVENT,
  getResguardos,
  isResguardoConfirmado,
  isResguardoPendiente,
  normalizeResguardo,
  resguardoToActivo,
} from "../services/resguardoService";

const INITIAL_STATE = {
  resguardos: [],
  isLoading: true,
  error: "",
};

function normalizeUserRole(currentUser) {
  const roleCandidates = [
    currentUser?.rol,
    currentUser?.role,
    currentUser?.roles,
    currentUser?.rol?.nombre,
    currentUser?.rol?.name,
  ]
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .map((value) => {
      if (value && typeof value === "object") {
        return value.nombre ?? value.name ?? "";
      }
      return value ?? "";
    })
    .filter(Boolean);

  const role = roleCandidates.join(" ").toString().trim().toLowerCase();
  const roleNoAccents = role.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (!role) return "";
  if (roleNoAccents.includes("usuario") || roleNoAccents.includes("role_user")) return "usuario";
  if (roleNoAccents.includes("admin") || roleNoAccents.includes("role_admin")) return "admin";
  if (roleNoAccents.includes("tecnico") || roleNoAccents.includes("role_technician")) {
    return "tecnico";
  }
  return role;
}

function buildProductLabel(resguardo) {
  const activo = normalizeResguardo(resguardo)?.activo ?? {};
  return (
    activo?.producto?.completo ||
    activo?.producto?.tipo_activo ||
    activo?.producto?.modelo ||
    activo?.tipo_activo ||
    "Sin producto"
  );
}

function buildLocationLabel(resguardo) {
  const activo = normalizeResguardo(resguardo)?.activo ?? {};
  return (
    activo?.ubicacion?.completa ||
    [activo?.ubicacion?.campus, activo?.ubicacion?.edificio, activo?.ubicacion?.aula]
      .filter(Boolean)
      .join(" ")
  );
}

function buildPendingItem(resguardo) {
  const normalized = normalizeResguardo(resguardo);
  return {
    ...normalized,
    id_activo: normalized.activoId ?? normalized.activo?.id_activo ?? normalized.activo?.idActivo ?? null,
    etiqueta_bien: normalized.activo?.etiqueta_bien ?? normalized.activo?.etiquetaBien ?? "",
    productoNombre: buildProductLabel(normalized),
    ubicacionNombre: buildLocationLabel(normalized),
  };
}

function dedupePendingItems(items) {
  const map = new Map();

  for (const item of items) {
    const resguardoId = item?.resguardoId ?? item?.id_resguardo ?? null;
    const activoId = item?.activoId ?? item?.id_activo ?? item?.activo?.id_activo ?? null;
    const key = resguardoId != null ? `res-${resguardoId}` : `act-${activoId}`;
    if (!map.has(key)) {
      map.set(key, item);
    }
  }

  return Array.from(map.values());
}

export function usePendientesResguardo(currentUser) {
  const [state, setState] = useState(INITIAL_STATE);
  const [refreshToken, setRefreshToken] = useState(0);

  const isUsuario = normalizeUserRole(currentUser) === "usuario";

  const refresh = useCallback(() => {
    setRefreshToken((value) => value + 1);
  }, []);

  useEffect(() => {
    let active = true;

    if (!isUsuario) {
      return () => {
        active = false;
      };
    }

    async function loadResguardos() {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: "",
      }));

      try {
        const list = await getResguardos();
        if (!active) return;

        setState({
          resguardos: Array.isArray(list) ? list : [],
          isLoading: false,
          error: "",
        });
      } catch (error) {
        if (!active) return;

        setState({
          resguardos: [],
          isLoading: false,
          error: error?.message || "No fue posible cargar los resguardos.",
        });
      }
    }

    loadResguardos();

    return () => {
      active = false;
    };
  }, [isUsuario, refreshToken]);

  useEffect(() => {
    if (!isUsuario) return undefined;

    const handleRefresh = () => {
      setRefreshToken((value) => value + 1);
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        handleRefresh();
      }
    };

    window.addEventListener("focus", handleRefresh);
    window.addEventListener(RESGUARDOS_CHANGED_EVENT, handleRefresh);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("focus", handleRefresh);
      window.removeEventListener(RESGUARDOS_CHANGED_EVENT, handleRefresh);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [isUsuario]);

  const pendientesResguardo = useMemo(() => {
    if (!isUsuario) return [];
    return dedupePendingItems(
      state.resguardos.filter(isResguardoPendiente).map(buildPendingItem)
    );
  }, [state.resguardos, isUsuario]);

  const bienesConfirmados = useMemo(() => {
    if (!isUsuario) return [];
    return state.resguardos
      .filter(isResguardoConfirmado)
      .map(resguardoToActivo);
  }, [state.resguardos, isUsuario]);

  return {
    resguardos: state.resguardos,
    pendientesResguardo,
    bienesConfirmados,
    isLoading: isUsuario ? state.isLoading : false,
    error: isUsuario ? state.error : "",
    refresh,
  };
}
