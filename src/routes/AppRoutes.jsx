import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../Components/ProtectedRoute";
import { ROUTES, PROTECTED_ROUTES } from "../config/routes";

const Login = lazy(() => import("../Pages/Login"));
const ForgotPassword = lazy(() => import("../Pages/ForgotPassword"));
const Dashboard = lazy(() => import("../Pages/DashBoard"));
const BienesRegistrados = lazy(() => import("../Pages/BienesRegistrados"));
const MisBienes = lazy(() => import("../Pages/MisBienes"));
const MisReparaciones = lazy(() => import("../Pages/MisReparaciones"));
const AssetDetail = lazy(() => import("../Pages/AssetDetail"));
const PerfilUsuario = lazy(() => import("../Pages/PerfilUsuario"));
const Usuarios = lazy(() => import("../Pages/Usuarios"));
const RegistrarUsuario = lazy(() => import("../Pages/RegistrarUsuario"));
const EditarPerfil = lazy(() => import("../Pages/EditarPerfil"));
const Catalogos = lazy(() => import("../Pages/Catalogos"));
const RegistroBien = lazy(() => import("../Pages/RegistroBien"));
const AsignacionBien = lazy(() => import("../Pages/AsignacionBien"));
const AsignacionReporte = lazy(() => import("../Pages/AsignacionReporte"));
const Historial = lazy(() => import("../Pages/Historial"));
const ConfirmaResguardo = lazy(() => import("../Pages/ConfirmaResguardo"));
const ReportarBien = lazy(() => import("../Pages/ReportarBien"));
const InformacionReporte = lazy(() => import("../Pages/InformacionReporte"));
const ReporteTecnico = lazy(() => import("../Pages/ReporteTecnico"));
const ResetPassword = lazy(() => import("../Pages/ResetPassword"));

const { LOGIN, FORGOT_PASSWORD, RESET_PASSWORD } = ROUTES;
const {
  BIENES_REGISTRADOS,
  MIS_BIENES,
  REPORTAR_BIEN,
  MIS_REPARACIONES,
  USUARIOS,
  REGISTRAR_USUARIO,
  CATALOGOS,
  REGISTRO_BIEN,
  ASIGNAR_BIEN,
  ASIGNAR_REPORTE,
  HISTORIAL,
  DASHBOARD,
  ACTIVO_DETALLE,
  REPORTE_DETALLE,
  REPORTE_TECNICO,
  CONFIRMAR_RESGUARDO,
  PERFIL,
  PERFIL_ID,
  PERFIL_EDITAR,
  PERFIL_ID_EDITAR,
} = PROTECTED_ROUTES;

function LoadingFallback() {
  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Cargando...</span>
      </div>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path={LOGIN} element={<Login />} />
        <Route path={FORGOT_PASSWORD} element={<ForgotPassword />} />

        <Route path={RESET_PASSWORD} element={<ResetPassword />} />

        <Route
          path={BIENES_REGISTRADOS}
          element={
            <ProtectedRoute>
              <BienesRegistrados/>
            </ProtectedRoute>
          }
        />
        <Route
          path={MIS_BIENES}
          element={
            <ProtectedRoute>
              <MisBienes />
            </ProtectedRoute>
          }
        />
        <Route
          path={REPORTAR_BIEN}
          element={
            <ProtectedRoute requiredRole="usuario">
              <ReportarBien />
            </ProtectedRoute>
          }
        />
        <Route
          path={MIS_REPARACIONES}
          element={
            <ProtectedRoute>
              <MisReparaciones />
            </ProtectedRoute>
          }
        />
        <Route
          path={USUARIOS}
          element={
            <ProtectedRoute requiredRole="admin">
              <Usuarios />
            </ProtectedRoute>
          }
        />
        <Route
          path={REGISTRAR_USUARIO}
          element={
            <ProtectedRoute requiredRole="admin">
              <RegistrarUsuario />
            </ProtectedRoute>
          }
        />
        <Route
          path={CATALOGOS}
          element={
            <ProtectedRoute requiredRole="admin">
              <Catalogos />
            </ProtectedRoute>
          }
        />
        <Route
          path={REGISTRO_BIEN}
          element={
            <ProtectedRoute requiredRole="admin">
              <RegistroBien />
            </ProtectedRoute>
          }
        />
        <Route
          path={ASIGNAR_BIEN}
          element={
            <ProtectedRoute requiredRole="admin">
              <AsignacionBien />
            </ProtectedRoute>
          }
        />
        <Route
          path={ASIGNAR_REPORTE}
          element={
            <ProtectedRoute requiredRole="admin">
              <AsignacionReporte />
            </ProtectedRoute>
          }
        />
        <Route
          path={HISTORIAL}
          element={
            <ProtectedRoute requiredRole="admin">
              <Historial />
            </ProtectedRoute>
          }
        />
        <Route
          path={DASHBOARD}
          element={
            <ProtectedRoute requiredRole="admin">
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path={ACTIVO_DETALLE}
          element={
            <ProtectedRoute>
              <AssetDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path={REPORTE_DETALLE}
          element={
            <ProtectedRoute>
              <InformacionReporte />
            </ProtectedRoute>
          }
        />
        <Route
          path={REPORTE_TECNICO}
          element={
            <ProtectedRoute requiredRole="tecnico">
              <ReporteTecnico />
            </ProtectedRoute>
          }
        />
        <Route
          path={CONFIRMAR_RESGUARDO}
          element={
            <ProtectedRoute>
              <ConfirmaResguardo />
            </ProtectedRoute>
          }
        />
        <Route
          path={PERFIL}
          element={
            <ProtectedRoute>
              <PerfilUsuario />
            </ProtectedRoute>
          }
        />
        <Route
          path={PERFIL_ID}
          element={
            <ProtectedRoute>
              <PerfilUsuario />
            </ProtectedRoute>
          }
        />
        <Route
          path={PERFIL_EDITAR}
          element={
            <ProtectedRoute>
              <EditarPerfil />
            </ProtectedRoute>
          }
        />
        <Route
          path={PERFIL_ID_EDITAR}
          element={
            <ProtectedRoute>
              <EditarPerfil />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to={LOGIN} replace />} />
        
      </Routes>
    </Suspense>
  );
}
