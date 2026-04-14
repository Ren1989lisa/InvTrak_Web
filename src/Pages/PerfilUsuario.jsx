import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Container, Button, Alert } from "react-bootstrap";

import NavbarMenu from "../Components/NavbarMenu";
import SidebarMenu from "../Components/SidebarMenu";
import ProfileHeader from "../Components/ProfileHeader";
import ProfileInfoCard from "../Components/ProfileInfoCard";
import PrimaryButton from "../Components/PrimaryButton";
import { useUsers } from "../context/UsersContext";
import { usePendientesResguardo } from "../hooks/usePendientesResguardo";
import { getPerfilActual, getUsuarios } from "../services/userService";
import { openQRFilePicker } from "../utils/decodeQRFromFile";
import "../Style/bienes-registrados.css";
import "../Style/profile.css";
import "../Style/sidebar.css";

function mapRol(value) {
  if (Array.isArray(value) && value.length > 0) {
    return mapRol(value[0]);
  }
  const role = (value ?? "").toString().trim().toUpperCase();
  if (role === "ROLE_ADMINISTRADOR" || role === "ADMINISTRADOR" || role === "ADMIN") return "admin";
  if (role === "ROLE_TECNICO" || role === "TECNICO") return "tecnico";
  if (role === "ROLE_USUARIO" || role === "USUARIO") return "usuario";
  return (value ?? "").toString().trim().toLowerCase();
}

export default function PerfilUsuario() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { currentUser, logout, menuItems, isAdmin } = useUsers();
  const [openSidebar, setOpenSidebar] = useState(false);
  const [perfil, setPerfil] = useState(null);
  const [perfilError, setPerfilError] = useState("");
  const [loadingPerfil, setLoadingPerfil] = useState(false);
  const {
    pendientesResguardo,
    isLoading: loadingResguardos,
    error: errorResguardos,
    refresh: refreshResguardos,
  } = usePendientesResguardo(currentUser);
  const isUsuario = (currentUser?.rol ?? "").toString().toLowerCase() === "usuario";

  useEffect(() => {
    let active = true;

    async function loadPerfil() {
      setLoadingPerfil(true);
      setPerfilError("");
      try {
        const token =
          window.localStorage.getItem("invtrack_auth_token") ||
          window.localStorage.getItem("token");
        if (!token) {
          navigate("/login", { replace: true });
          return;
        }

        const response = await getPerfilActual();
        if (!active) return;
        const myId = response?.id_usuario ?? response?.idUsuario ?? response?.id ?? null;
        const targetId = id != null ? String(id) : null;

        if (
          targetId &&
          myId != null &&
          String(targetId) !== String(myId) &&
          isAdmin
        ) {
          const usuarios = await getUsuarios();
          if (!active) return;
          const selected =
            (Array.isArray(usuarios) ? usuarios : []).find(
              (u) =>
                String(u?.id_usuario ?? u?.idUsuario ?? u?.id ?? "") === String(targetId)
            ) ?? null;
          setPerfil(selected ?? response);
          return;
        }

        setPerfil(response);
      } catch (error) {
        if (!active) return;
        if (error?.status === 401) {
          navigate("/login", { replace: true });
          return;
        }
        setPerfilError("No se pudo cargar la información del perfil.");
      } finally {
        if (active) setLoadingPerfil(false);
      }
    }

    loadPerfil();
    return () => {
      active = false;
    };
  }, [id, isAdmin, navigate]);

  const usuario = useMemo(() => {
    if (!perfil) return null;
    return {
      id_usuario:
        perfil?.id_usuario ??
        perfil?.idUsuario ??
        perfil?.id ??
        currentUser?.id_usuario ??
        null,
      nombre: perfil?.nombre ?? null,
      nombre_completo: perfil?.nombre ?? null,
      correo: perfil?.correo ?? null,
      numero_empleado: perfil?.numeroEmpleado ?? perfil?.numero_empleado ?? null,
      area: perfil?.area ?? null,
      curp: perfil?.curp ?? null,
      fecha_nacimiento: perfil?.fechaNacimiento ?? perfil?.fecha_nacimiento ?? null,
      rol: mapRol(perfil?.rol),
    };
  }, [perfil, currentUser?.id_usuario]);

  return (
    <div className="inv-page">
      <NavbarMenu
        title="Perfil"
        onMenuClick={() => setOpenSidebar((v) => !v)}
        notificationItems={
          isUsuario
            ? pendientesResguardo.map((item) => ({
                ...item,
                onSubirQR: () => {
                  const targetId =
                    item?.activoId ?? item?.id_activo ?? item?.activo?.id_activo;
                  if (targetId == null) return;
                  openQRFilePicker({
                    activoIdEsperado: targetId,
                    onSuccess: (activoId) => {
                      navigate(`/confirmar-resguardo/${targetId}`, {
                        state: { validatedActivoId: activoId },
                      });
                    },
                    onError: (message) => {
                      navigate(`/confirmar-resguardo/${targetId}`, {
                        state: { qrError: message },
                      });
                    },
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
          logout();
          navigate("/login");
        }}
      />

      <Container
        fluid
        className="inv-content px-3 px-md-4 py-3 inv-profile-content"
      >
        {perfilError ? (
          <Alert
            variant="danger"
            dismissible
            onClose={() => setPerfilError("")}
            className="mb-2"
          >
            {perfilError}
          </Alert>
        ) : null}
        {errorResguardos ? (
          <Alert variant="danger" className="d-flex align-items-center justify-content-between gap-3 mb-2">
            <span>{errorResguardos}</span>
            <PrimaryButton
              variant="outline-danger"
              label="Reintentar"
              className="flex-shrink-0"
              onClick={refreshResguardos}
            />
          </Alert>
        ) : null}
        {loadingPerfil ? (
          <Alert variant="info" className="mb-2">
            Cargando perfil...
          </Alert>
        ) : null}
        {loadingResguardos ? (
          <Alert variant="info" className="mb-2">
            Cargando resguardos pendientes...
          </Alert>
        ) : null}
        {isUsuario && pendientesResguardo.length > 0 ? (
          <Alert variant="warning" className="mb-2">
            Tienes bienes pendientes por confirmar
          </Alert>
        ) : null}
        <Button
          type="button"
          variant="link"
          className="inv-back-btn"
          onClick={() => navigate(-1)}
        >
          ← Regresar
        </Button>

        {!loadingPerfil && usuario && (
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
                  onClick={() =>
                    navigate(
                      usuario?.id_usuario ? `/perfil/${usuario.id_usuario}/editar` : "/perfil/editar"
                    )
                  }
                />
              </div>
            )}
          </>
        )}
      </Container>
    </div>
  );
}
