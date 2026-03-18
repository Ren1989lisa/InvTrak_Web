import { createContext, useContext, useEffect, useMemo, useState } from "react";
import usuariosSeed from "../data/usuarios.json";

const STORAGE_KEY = "invtrack_users";
const STORAGE_CURRENT_USER_KEY = "invtrack_current_user_id";

const UsersContext = createContext(null);

// Menú completo para admin
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

// Menú para usuario (solo mis bienes y perfil)
const MENU_USUARIO = [
  { icon: "grid", label: "Mis bienes", route: "/mis-bienes" },
  { icon: "users", label: "Mi perfil", route: "/perfil" },
];

// Menú para técnico (solo mis reparaciones y perfil)
const MENU_TECNICO = [
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

const RUTAS_USUARIO = ["/mis-bienes", "/perfil"];
const RUTAS_TECNICO = ["/mis-reparaciones", "/perfil"];

function canAccessRoute(rol, path) {
  const r = (rol ?? "").toString().toLowerCase();
  const p = (path ?? "").toString().replace(/\/$/, "");

  if (r === "admin") return true;

  if (r === "usuario") {
    if (RUTAS_USUARIO.some((ruta) => p === ruta)) return true;
    if (p.startsWith("/perfil/") || p.startsWith("/activo/")) return true;
    return false;
  }

  if (r === "tecnico") {
    if (RUTAS_TECNICO.some((ruta) => p === ruta)) return true;
    if (p.startsWith("/perfil/") || p.startsWith("/activo/")) return true;
    return false;
  }

  return false;
}

function getDefaultRouteByRol(rol) {
  const r = (rol ?? "").toString().toLowerCase();
  if (r === "admin") return "/dashboard";
  if (r === "usuario") return "/mis-bienes";
  if (r === "tecnico") return "/mis-reparaciones";
  return "/mis-bienes";
}

function loadUsers() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return Array.isArray(usuariosSeed) ? usuariosSeed : [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return Array.isArray(usuariosSeed) ? usuariosSeed : [];
  }
}

function loadCurrentUserId() {
  try {
    const raw = window.localStorage.getItem(STORAGE_CURRENT_USER_KEY);
    if (raw === null) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function UsersProvider({ children }) {
  const [users, setUsers] = useState(loadUsers);
  const [currentUserId, setCurrentUserId] = useState(loadCurrentUserId);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUserId === null || currentUserId === undefined) {
      window.localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
      return;
    }
    window.localStorage.setItem(STORAGE_CURRENT_USER_KEY, String(currentUserId));
  }, [currentUserId]);

  const addUser = (user) => {
    setUsers((prev) => [...prev, user]);
  };

  const currentUser =
    users.find((u) => Number(u?.id_usuario) === Number(currentUserId)) ?? null;

  const userRole = currentUser?.rol ?? null;

  const menuItems = useMemo(
    () => getMenuByRol(currentUser?.rol),
    [currentUser?.rol]
  );

  const canAccess = useMemo(
    () => (path) => canAccessRoute(currentUser?.rol, path),
    [currentUser?.rol]
  );

  const defaultRoute = useMemo(
    () => getDefaultRouteByRol(currentUser?.rol),
    [currentUser?.rol]
  );

  const isAdmin = (currentUser?.rol ?? "").toString().toLowerCase() === "admin";

  const value = useMemo(
    () => ({
      users,
      addUser,
      setUsers,
      currentUser,
      currentUserId,
      setCurrentUserId,
      userRole,
      menuItems,
      canAccess,
      defaultRoute,
      isAdmin,
    }),
    [users, currentUser, currentUserId, userRole, menuItems, canAccess, defaultRoute, isAdmin]
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

