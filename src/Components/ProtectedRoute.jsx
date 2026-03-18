import { Navigate, useLocation } from "react-router-dom";
import { useUsers } from "../context/UsersContext";

/**
 * Protege rutas según rol. Si no hay sesión, redirige a login.
 * Si hay sesión pero no tiene acceso a la ruta, redirige a la ruta por defecto de su rol.
 */
export default function ProtectedRoute({ children, requiredRole = null }) {
  const location = useLocation();
  const { currentUserId, currentUser, canAccess, defaultRoute } = useUsers();

  if (currentUserId === null || currentUserId === undefined) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  const path = location.pathname;

  const rol = (currentUser?.rol ?? "").toString().toLowerCase();
  if (requiredRole === "admin" && rol !== "admin") {
    return <Navigate to={defaultRoute} replace />;
  }
  if (requiredRole === "usuario" && rol !== "usuario") {
    return <Navigate to={defaultRoute} replace />;
  }

  if (!canAccess(path)) {
    return <Navigate to={defaultRoute} replace />;
  }

  return children;
}
