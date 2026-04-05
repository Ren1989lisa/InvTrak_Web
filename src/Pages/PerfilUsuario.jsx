import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Container, Button, Alert } from "react-bootstrap";

import NavbarMenu from "../Components/NavbarMenu";
import SidebarMenu from "../Components/SidebarMenu";
import ProfileHeader from "../Components/ProfileHeader";
import ProfileInfoCard from "../Components/ProfileInfoCard";
import PrimaryButton from "../Components/PrimaryButton";
import { useUsers } from "../context/UsersContext";
import { usePendientesResguardo } from "../hooks/usePendientesResguardo";
import { openQRFilePicker } from "../utils/decodeQRFromFile";
import "../Style/bienes-registrados.css";
import "../Style/profile.css";
import "../Style/sidebar.css";

export default function PerfilUsuario() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { users, currentUser, setCurrentUserId, menuItems, defaultRoute, isAdmin } = useUsers();
  const [openSidebar, setOpenSidebar] = useState(false);
  const [qrError, setQrError] = useState("");
  const pendientesResguardo = usePendientesResguardo(currentUser);
  const isUsuario = (currentUser?.rol ?? "").toString().toLowerCase() === "usuario";

  const usuarios = useMemo(
    () => (Array.isArray(users) ? users : []),
    [users]
  );

  const idNum = Number(id);
  const usuarioSeleccionado = Number.isFinite(idNum)
    ? usuarios.find((u) => Number(u?.id_usuario) === idNum)
    : null;
  const usuario = usuarioSeleccionado ?? currentUser ?? usuarios[0];
  const rutaRegreso =
    isAdmin && usuarioSeleccionado && Number(usuarioSeleccionado?.id_usuario) !== Number(currentUser?.id_usuario)
      ? "/usuarios"
      : defaultRoute;

  return (
    <div className="inv-page">
      <NavbarMenu
        title="Perfil"
        onMenuClick={() => setOpenSidebar((v) => !v)}
        notificationItems={
          isUsuario
            ? pendientesResguardo.map((a) => ({
                ...a,
                onSubirQR: (item) => {
                  setQrError("");
                  openQRFilePicker({
                    codigoEsperado: item.etiqueta_bien,
                    onSuccess: (idActivo) => {
                      const targetId = idActivo ?? item.id_activo;
                      navigate(`/confirmar-resguardo/${targetId}`);
                    },
                    onError: (msg) => setQrError(msg),
                  });
                },
              }))
            : null
        }
      />

      <SidebarMenu
        open={openSidebar}
        onClose={() => setOpenSidebar(false)}
        userName={currentUser?.nombre_completo}
        items={menuItems}
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
        {qrError && (
          <Alert
            variant="danger"
            dismissible
            onClose={() => setQrError("")}
            className="mb-2"
          >
            {qrError}
          </Alert>
        )}
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
            <ProfileHeader name={usuario.nombre ?? usuario.nombre_completo} />
            <div className="inv-profile-cardWrapper">
              <ProfileInfoCard usuario={usuario} />
            </div>
            {isAdmin && (
              <div className="inv-profile-actions">
                <PrimaryButton
                  variant="primary"
                  label="Editar Perfil"
                  className="inv-profile-editBtn"
                  onClick={() => navigate(`/perfil/${usuario.id_usuario}/editar`)}
                />
              </div>
            )}
          </>
        )}
      </Container>
    </div>
  );
}

