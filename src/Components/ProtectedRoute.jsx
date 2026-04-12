import { Navigate, useLocation } from "react-router-dom";
import { useUsers } from "../context/UsersContext";
import { ROUTES } from "../config/routes";

export default function ProtectedRoute({ children, requiredRole = null }) {
  const location = useLocation();
  const { isAuthenticated, currentUser, canAccess, defaultRoute } = useUsers();

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  const path = location.pathname;

  const rol = (currentUser?.rol ?? "").toString().toLowerCase().trim();
  const isAdmin = rol === "admin" || rol === "administrador";
  const isTecnico = rol === "tecnico" || rol === "técnico";
  const isUsuario = rol === "usuario";

  if (requiredRole === "admin" && !isAdmin) {
    return <Navigate to={defaultRoute} replace />;
  }
  if (requiredRole === "usuario" && !isUsuario) {
    return <Navigate to={defaultRoute} replace />;
  }
  if (requiredRole === "tecnico" && !isTecnico) {
    return <Navigate to={defaultRoute} replace />;
  }

  if (!canAccess(path)) {
    return <Navigate to={defaultRoute} replace />;
  }

  return children;
}
