import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getDefaultRouteByRole } from "../config/routes";
import {
  getCurrentUser as getStoredCurrentUser,
  login as authLogin,
  logout as authLogout,
  getToken,
} from "../services/authService";
import { getPerfilActual } from "../services/userService";

const UsersContext = createContext(null);

const MENU_ADMIN = [
  { icon: "grid", label: "Activos", route: "/bienes-registrados" },
  { icon: "users", label: "Usuarios", route: "/usuarios" },
  { icon: "folder", label: "Catalogos", route: "/catalogos" },
  { icon: "clock", label: "Historial", route: "/historial" },
  { icon: "report", label: "Asignar Activo", route: "/asignar-bien" },
  { icon: "report", label: "Asignar Reporte", route: "/asignar-reporte" },
  { icon: "grid", label: "Dashboard", route: "/dashboard" },
  { icon: "box", label: "Registro de activos", route: "/registro-bien" },
  { icon: "returns", label: "Devoluciones y bajas", route: "/devoluciones-bajas" },
];

const MENU_USUARIO = [
  { icon: "grid", label: "Mis activos", route: "/mis-bienes" },
  { icon: "report", label: "Reportar activo", route: "/reportar-bien" },
];

const MENU_TECNICO = [
  { icon: "report", label: "Mis reparaciones", route: "/mis-reparaciones" },
];

function getMenuByRol(rol) {
  const r = (rol ?? "").toString().toLowerCase();
  if (r === "admin") return MENU_ADMIN;
  if (r === "usuario") return MENU_USUARIO;
  if (r === "tecnico") return MENU_TECNICO;
  return MENU_USUARIO;
}

const RUTAS_USUARIO = ["/bienes-registrados", "/mis-bienes", "/perfil", "/reportar-bien", "/perfil/editar"];
const RUTAS_TECNICO = ["/mis-reparaciones", "/perfil", "/perfil/editar"];

function canAccessRoute(rol, path) {
  const r = (rol ?? "").toString().toLowerCase();
  const p = (path ?? "").toString().replace(/\/$/, "");

  if (r === "admin") return true;

  if (r === "usuario") {
    if (RUTAS_USUARIO.some((ruta) => p === ruta)) return true;
    if (p.endsWith("/editar") && p.startsWith("/perfil/")) return true;
    if (p.endsWith("/editar")) return false;
    if (p.startsWith("/perfil/") || p.startsWith("/activo/") || p.startsWith("/confirmar-resguardo/"))
      return true;
    return false;
  }

  if (r === "tecnico") {
    if (RUTAS_TECNICO.some((ruta) => p === ruta)) return true;
    if (p.endsWith("/editar") && p.startsWith("/perfil/")) return true;
    if (p.endsWith("/editar")) return false;
    if (p.startsWith("/perfil/") || p.startsWith("/activo/") || p.startsWith("/reporte/"))
      return true;
    return false;
  }

  return false;
}

function extractPerfilPayload(payload) {
  if (!payload || typeof payload !== "object") return null;
  if (payload.data && typeof payload.data === "object") return payload.data;
  if (payload.usuario && typeof payload.usuario === "object") return payload.usuario;
  return payload;
}

export function UsersProvider({ children }) {
  const [user, setUser] = useState(() => getStoredCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getToken() && getStoredCurrentUser()));
  const hydratedRef = useRef(false);

  const currentUser = user;
  const userRole = user?.rol ?? null;

  const menuItems = useMemo(
    () => getMenuByRol(user?.rol),
    [user?.rol]
  );

  const canAccess = useMemo(
    () => (path) => canAccessRoute(user?.rol, path),
    [user?.rol]
  );

  const defaultRoute = useMemo(
    () => getDefaultRouteByRole(user?.rol),
    [user?.rol]
  );

  const isAdmin = (user?.rol ?? "").toString().toLowerCase() === "admin";

  useEffect(() => {
    if (!isAuthenticated || !getToken()) {
      hydratedRef.current = false;
      return;
    }

    if (hydratedRef.current) return;
    hydratedRef.current = true;

    let active = true;

    async function hydrateCurrentUserProfile() {
      try {
        const rawPerfil = await getPerfilActual();
        if (!active) return;

        const perfil = extractPerfilPayload(rawPerfil);
        if (!perfil) return;

        const perfilNombre = (
          perfil?.nombre ??
          perfil?.nombreCompleto ??
          perfil?.nombre_completo ??
          ""
        )
          .toString()
          .trim();
        const perfilCorreo = (perfil?.correo ?? perfil?.email ?? "").toString().trim();
        const perfilId =
          perfil?.id_usuario ??
          perfil?.idUsuario ??
          perfil?.id ??
          null;

        setUser((prev) => {
          if (!prev) return prev;

          const nextNombre =
            perfilNombre ||
            (prev?.nombre ?? prev?.nombre_completo ?? "").toString().trim();
          const nextNombreCompleto =
            perfilNombre ||
            (prev?.nombre_completo ?? prev?.nombre ?? "").toString().trim();
          const nextCorreo =
            perfilCorreo || (prev?.correo ?? "").toString().trim();
          const nextId =
            perfilId ??
            prev?.id_usuario ??
            prev?.id ??
            null;

          const nextUser = {
            ...prev,
            id_usuario: nextId,
            nombre: nextNombre,
            nombre_completo: nextNombreCompleto,
            correo: nextCorreo,
          };

          const changed =
            nextUser.id_usuario !== prev.id_usuario ||
            nextUser.nombre !== prev.nombre ||
            nextUser.nombre_completo !== prev.nombre_completo ||
            nextUser.correo !== prev.correo;

          if (!changed) return prev;

          window.localStorage.setItem("invtrack_auth_user", JSON.stringify(nextUser));
          return nextUser;
        });
      } catch {
        // Si falla /usuario/me mantenemos la sesión actual sin romper UI.
      }
    }

    hydrateCurrentUserProfile();

    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  const login = useCallback(async (correo, password) => {
    const nextUser = await authLogin(correo, password);
    setUser(nextUser);
    setIsAuthenticated(true);
    return nextUser;
  }, []);

  const logout = useCallback(() => {
    authLogout();
    setUser(null);
    setIsAuthenticated(false);
    hydratedRef.current = false;
  }, []);

  const updateCurrentUser = useCallback((partialUser) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...partialUser };
      window.localStorage.setItem("invtrack_auth_user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      isAuthenticated,
      currentUser,
      users: user ? [user] : [],
      userRole,
      menuItems,
      canAccess,
      defaultRoute,
      isAdmin,
      updateCurrentUser,
    }),
    [
      user,
      isAuthenticated,
      userRole,
      menuItems,
      canAccess,
      defaultRoute,
      isAdmin,
      login,
      logout,
      updateCurrentUser,
    ]
  );

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
}

export function useUsers() {
  const ctx = useContext(UsersContext);
  if (!ctx) {
    throw new Error("useUsers must be used within UsersProvider");
  }
  return ctx;
}
