import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./Pages/Login";
import Dashboard from "./Pages/DashBoard";
import ForgotPassword from "./Pages/ForgotPassword";
import BienesRegistrados from "./Pages/BienesRegistrados";
import MisBienes from "./Pages/MisBienes";
import MisReparaciones from "./Pages/MisReparaciones";
import AssetDetail from "./Pages/AssetDetail";
import PerfilUsuario from "./Pages/PerfilUsuario";
import Usuarios from "./Pages/Usuarios";
import RegistrarUsuario from "./Pages/RegistrarUsuario";
import EditarPerfil from "./Pages/EditarPerfil";
import Catalogos from "./Pages/Catalogos";
import RegistroBien from "./Pages/RegistroBien";
import AsignacionBien from "./Pages/AsignacionBien";
import AsignacionReporte from "./Pages/AsignacionReporte";
import Historial from "./Pages/Historial";
import ProtectedRoute from "./Components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/bienes-registrados" element={<ProtectedRoute><BienesRegistrados /></ProtectedRoute>} />
        <Route path="/mis-bienes" element={<ProtectedRoute><MisBienes /></ProtectedRoute>} />
        <Route path="/mis-reparaciones" element={<ProtectedRoute><MisReparaciones /></ProtectedRoute>} />
        <Route path="/usuarios" element={<ProtectedRoute requiredRole="admin"><Usuarios /></ProtectedRoute>} />
        <Route path="/usuarios/registrar" element={<ProtectedRoute requiredRole="admin"><RegistrarUsuario /></ProtectedRoute>} />
        <Route path="/catalogos" element={<ProtectedRoute requiredRole="admin"><Catalogos /></ProtectedRoute>} />
        <Route path="/registro-bien" element={<ProtectedRoute requiredRole="admin"><RegistroBien /></ProtectedRoute>} />
        <Route path="/asignar-bien" element={<ProtectedRoute requiredRole="admin"><AsignacionBien /></ProtectedRoute>} />
        <Route path="/asignar-reporte" element={<ProtectedRoute requiredRole="admin"><AsignacionReporte /></ProtectedRoute>} />
        <Route path="/historial" element={<ProtectedRoute requiredRole="admin"><Historial /></ProtectedRoute>} />
        <Route path="/activo/:id" element={<ProtectedRoute><AssetDetail /></ProtectedRoute>} />
        <Route path="/perfil" element={<ProtectedRoute><PerfilUsuario /></ProtectedRoute>} />
        <Route path="/perfil/:id" element={<ProtectedRoute><PerfilUsuario /></ProtectedRoute>} />
        <Route path="/perfil/editar" element={<ProtectedRoute><EditarPerfil /></ProtectedRoute>} />
        <Route path="/perfil/:id/editar" element={<ProtectedRoute><EditarPerfil /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;