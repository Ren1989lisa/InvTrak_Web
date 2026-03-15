import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./Pages/Login";
import Dashboard from "./Pages/DashBoard";
import ForgotPassword from "./Pages/ForgotPassword";
import BienesRegistrados from "./Pages/BienesRegistrados";
import AssetDetail from "./Pages/AssetDetail";
import PerfilUsuario from "./Pages/PerfilUsuario";
import Usuarios from "./Pages/Usuarios";
import RegistrarUsuario from "./Pages/RegistrarUsuario";
import EditarPerfil from "./Pages/EditarPerfil";
import Catalogos from "./Pages/Catalogos";
import RegistroBien from "./Pages/RegistroBien";
import AsignacionBien from "./Pages/AsignacionBien";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/bienes-registrados" element={<BienesRegistrados />} />
        <Route path="/usuarios" element={<Usuarios />} />
        <Route path="/usuarios/registrar" element={<RegistrarUsuario />} />
        <Route path="/catalogos" element={<Catalogos />} />
        <Route path="/registro-bien" element={<RegistroBien />} />
        <Route path="/asignar-bien" element={<AsignacionBien />} />
        <Route path="/activo/:id" element={<AssetDetail />} />
        <Route path="/perfil" element={<PerfilUsuario />} />
        <Route path="/perfil/:id" element={<PerfilUsuario />} />
        <Route path="/perfil/editar" element={<EditarPerfil />} />
        <Route path="/perfil/:id/editar" element={<EditarPerfil />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;