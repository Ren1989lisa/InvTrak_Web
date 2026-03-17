import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Container, Button } from "react-bootstrap";

import NavbarMenu from "../Components/NavbarMenu";
import SidebarMenu from "../Components/SidebarMenu";
import ProfileHeader from "../Components/ProfileHeader";
import ProfileInfoCard from "../Components/ProfileInfoCard";
import PrimaryButton from "../Components/PrimaryButton";
import { useUsers } from "../context/UsersContext";
import "../Style/bienes-registrados.css";
import "../Style/profile.css";
import "../Style/sidebar.css";

export default function PerfilUsuario() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { users, currentUser, setCurrentUserId } = useUsers();
  const [openSidebar, setOpenSidebar] = useState(false);

  const usuarios = useMemo(
    () => (Array.isArray(users) ? users : []),
    [users]
  );

  const idNum = Number(id);
  const usuarioSeleccionado = Number.isFinite(idNum)
    ? usuarios.find((u) => Number(u?.id_usuario) === idNum)
    : null;
  const usuario = usuarioSeleccionado ?? usuarios[0];
  const rutaRegreso = usuarioSeleccionado ? "/usuarios" : "/bienes-registrados";
  const sidebarItems = [
    { icon: "grid", label: "Bienes", route: "/bienes-registrados" },
    { icon: "users", label: "Usuarios", route: "/usuarios" },
    { icon: "folder", label: "Catalogos", route: "/catalogos" },
    { icon: "report", label: "Reportes", route: "/reportes" },
    { icon: "clock", label: "Historial", route: "/historial" },
    { icon: "report", label: "Asignar Bien", route: "/asignar-bien" },
    { icon: "report", label: "Asignar Reporte", route: "/asignar-reporte" },
    { icon: "grid", label: "Dashboard", route: "/dashboard" },
    { icon: "box", label: "Registro de bienes", route: "/registro-bien" },
  ];

  return (
    <div className="inv-page">
      <NavbarMenu title="Perfil" onMenuClick={() => setOpenSidebar((v) => !v)} />

      <SidebarMenu
        open={openSidebar}
        onClose={() => setOpenSidebar(false)}
        userName={currentUser?.nombre_completo}
        items={sidebarItems}
        onViewProfile={() => {
          setOpenSidebar(false);
          if (currentUser) {
            navigate(`/perfil/${currentUser.id_usuario}`);
          } else {
            navigate("/perfil");
          }
        }}
        onLogout={() => {
          setOpenSidebar(false);
          setCurrentUserId(null);
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
          onClick={() => navigate(rutaRegreso)}
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
                onClick={() => navigate(`/perfil/${usuario.id_usuario}/editar`)}
              />
            </div>
          </>
        )}
      </Container>
    </div>
  );
}

