import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { getDefaultRouteByRole } from "../config/routes";
import {
  getCurrentUser as getStoredCurrentUser,
  login as authLogin,
  logout as authLogout,
  getToken,
} from "../services/authService";

const UsersContext = createContext(null);

const MENU_ADMIN = [
  { icon: "grid", label: "Bienes", route: "/bienes-registrados" },
  { icon: "users", label: "Usuarios", route: "/usuarios" },
  { icon: "folder", label: "Catalogos", route: "/catalogos" },
  { icon: "clock", label: "Historial", route: "/historial" },
  { icon: "report", label: "Asignar Bien", route: "/asignar-bien" },
  { icon: "report", label: "Asignar Reporte", route: "/asignar-reporte" },
  { icon: "grid", label: "Dashboard", route: "/dashboard" },
  { icon: "box", label: "Registro de bienes", route: "/registro-bien" },
];

const MENU_USUARIO = [
  { icon: "grid", label: "Bienes registrados", route: "/bienes-registrados" },
  { icon: "grid", label: "Mis bienes", route: "/mis-bienes" },
  { icon: "report", label: "Reportar bien", route: "/reportar-bien" },
  { icon: "users", label: "Mi perfil", route: "/perfil" },
];

const MENU_TECNICO = [
  { icon: "grid", label: "Bienes registrados", route: "/bienes-registrados" },
  { icon: "report", label: "Mis reparaciones", route: "/mis-reparaciones" },
  { icon: "users", label: "Mi perfil", route: "/perfil" },
];

function getMenuByRol(rol) {
  const r = (rol ?? "").toString().toLowerCase();
  if (r === "admin") return MENU_ADMIN;
  if (r === "usuario") return MENU_USUARIO;
  if (r === "tecnico") return MENU_TECNICO;
  return MENU_USUARIO;
}

const RUTAS_USUARIO = ["/bienes-registrados", "/mis-bienes", "/perfil", "/reportar-bien"];
const RUTAS_TECNICO = ["/bienes-registrados", "/mis-reparaciones", "/perfil"];

function canAccessRoute(rol, path) {
  const r = (rol ?? "").toString().toLowerCase();
  const p = (path ?? "").toString().replace(/\/$/, "");

  if (r === "admin") return true;

  if (r === "usuario") {
    if (RUTAS_USUARIO.some((ruta) => p === ruta)) return true;
    if (p.endsWith("/editar")) return false;
    if (p.startsWith("/perfil/") || p.startsWith("/activo/") || p.startsWith("/confirmar-resguardo/"))
      return true;
    return false;
  }

  if (r === "tecnico") {
    if (RUTAS_TECNICO.some((ruta) => p === ruta)) return true;
    if (p.endsWith("/editar")) return false;
    if (p.startsWith("/perfil/") || p.startsWith("/activo/") || p.startsWith("/reporte/"))
      return true;
    return false;
  }

  return false;
}

export function UsersProvider({ children }) {
  const [user, setUser] = useState(() => getStoredCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getToken() && getStoredCurrentUser()));

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

