export const ROUTES = {
  ROOT: "/",
  LOGIN: "/login",
  FORGOT_PASSWORD: "/forgot-password",
};

export const PROTECTED_ROUTES = {
  BIENES_REGISTRADOS: "/bienes-registrados",
  MIS_BIENES: "/mis-bienes",
  REPORTAR_BIEN: "/reportar-bien",
  MIS_REPARACIONES: "/mis-reparaciones",
  USUARIOS: "/usuarios",
  REGISTRAR_USUARIO: "/usuarios/registrar",
  CATALOGOS: "/catalogos",
  REGISTRO_BIEN: "/registro-bien",
  ASIGNAR_BIEN: "/asignar-bien",
  ASIGNAR_REPORTE: "/asignar-reporte",
  HISTORIAL: "/historial",
  DASHBOARD: "/dashboard",
  ACTIVO_DETALLE: "/activo/:id",
  REPORTE_DETALLE: "/reporte/:id",
  REPORTE_TECNICO: "/reporte/:id/reporte-tecnico",
  CONFIRMAR_RESGUARDO: "/confirmar-resguardo/:id",
  PERFIL: "/perfil",
  PERFIL_ID: "/perfil/:id",
  PERFIL_EDITAR: "/perfil/editar",
  PERFIL_ID_EDITAR: "/perfil/:id/editar",
};

export const POST_LOGIN_ROUTE = "/bienes-registrados";

export const DEFAULT_ROUTE_BY_ROLE = {
  admin: POST_LOGIN_ROUTE,
  usuario: POST_LOGIN_ROUTE,
  tecnico: POST_LOGIN_ROUTE,
};

export function getDefaultRouteByRole(rol) {
  const r = (rol ?? "").toString().toLowerCase();
  return DEFAULT_ROUTE_BY_ROLE[r] ?? POST_LOGIN_ROUTE;
}
