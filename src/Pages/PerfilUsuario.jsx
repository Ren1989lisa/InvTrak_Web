import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Button } from "react-bootstrap";

import NavbarMenu from "../Components/NavbarMenu";
import ProfileHeader from "../Components/ProfileHeader";
import ProfileInfoCard from "../Components/ProfileInfoCard";
import PrimaryButton from "../Components/PrimaryButton";

import usuariosData from "../Data/usuarios.json";
import "../Style/bienes-registrados.css";
import "../Style/profile.css";

export default function PerfilUsuario() {
  const navigate = useNavigate();

  const usuarios = useMemo(
    () => (Array.isArray(usuariosData) ? usuariosData : []),
    []
  );

  // Simulación de sesión: tomar el primer usuario.
  const usuario = usuarios[0];

  return (
    <div className="inv-page">
      <NavbarMenu title="Perfil" />

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

