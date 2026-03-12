import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Button } from "react-bootstrap";

import NavbarMenu from "../Components/NavbarMenu";
import SidebarMenu from "../Components/SidebarMenu";
import ProfileHeader from "../Components/ProfileHeader";
import ProfileInfoCard from "../Components/ProfileInfoCard";
import PrimaryButton from "../Components/PrimaryButton";

import usuariosData from "../data/usuarios.json";
import "../Style/bienes-registrados.css";
import "../Style/profile.css";
import "../Style/sidebar.css";

export default function PerfilUsuario() {
  const navigate = useNavigate();
  const [openSidebar, setOpenSidebar] = useState(false);

  const usuarios = useMemo(
    () => (Array.isArray(usuariosData) ? usuariosData : []),
    []
  );

  // Simulación de sesión: tomar el primer usuario.
  const usuario = usuarios[0];
  const sidebarItems = [
    { icon: "grid", label: "Bienes", route: "/bienes-registrados" },
    { icon: "users", label: "Usuarios", route: "/usuarios" },
    { icon: "box", label: "Activos", route: "/activos" },
    { icon: "folder", label: "Catalogos", route: "/catalogos" },
    { icon: "report", label: "Reportes", route: "/reportes" },
    { icon: "clock", label: "Historial", route: "/historial" },
  ];

  return (
    <div className="inv-page">
      <NavbarMenu title="Perfil" onMenuClick={() => setOpenSidebar((v) => !v)} />

      <SidebarMenu
        open={openSidebar}
        onClose={() => setOpenSidebar(false)}
        userName={usuario?.nombre_completo}
        items={sidebarItems}
        onViewProfile={() => setOpenSidebar(false)}
        onLogout={() => {
          setOpenSidebar(false);
          navigate("/");
        }}
      />

      <Container
        fluid
        className="inv-content px-3 px-md-4 py-3 inv-profile-content"
      >
        <Button
          type="button"
          variant="link"
          className="inv-back-btn"
          onClick={() => navigate("/bienes-registrados")}
        >
          ← Regresar
        </Button>

        {usuario && (
          <>
            <ProfileHeader name={usuario.nombre_completo} />
            <div className="inv-profile-cardWrapper">
              <ProfileInfoCard usuario={usuario} />
            </div>
            <div className="inv-profile-actions">
              <PrimaryButton
                variant="primary"
                label="Editar Perfil"
                className="inv-profile-editBtn"
              />
            </div>
          </>
        )}
      </Container>
    </div>
  );
}

