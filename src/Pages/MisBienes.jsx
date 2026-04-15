import { useEffect, useMemo, useState } from "react";
import { Alert, Container, Row, Col, Spinner, Toast, ToastContainer } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";

import NavbarMenu from "../Components/NavbarMenu";
import SearchBar from "../Components/SearchBar";
import AssetCard from "../Components/AssetCard";
import SidebarMenu from "../Components/SidebarMenu";
import PrimaryButton from "../Components/PrimaryButton";
import { useUsers } from "../context/UsersContext";
import { usePendientesResguardo } from "../hooks/usePendientesResguardo";
import "../Style/bienes-registrados.css";
import "../Style/sidebar.css";

function normalize(value) {
  return (value ?? "").toString().trim().toLowerCase();
}

function isUserRole(roleValue) {
  const candidates = [roleValue]
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .map((value) => {
      if (value && typeof value === "object") {
        return value.nombre ?? value.name ?? "";
      }
      return value ?? "";
    })
    .join(" ")
    .toLowerCase();

  return candidates.includes("usuario") || candidates.includes("role_user");
}

export default function MisBienes() {
  const [search, setSearch] = useState("");
  const [openSidebar, setOpenSidebar] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout, menuItems } = useUsers();
  const {
    pendientesResguardo,
    bienesConfirmados,
    isLoading,
    error,
    refresh,
  } = usePendientesResguardo(currentUser);

  const query = search.trim().toLowerCase();
  const isUsuario = isUserRole(currentUser?.rol ?? currentUser?.roles);

  const activosFiltrados = useMemo(() => {
    return bienesConfirmados.filter((activo) => {
      const codigo = normalize(activo?.etiqueta_bien);
      const tipo = normalize(
        activo?.producto?.completo ??
          activo?.producto?.tipo_activo ??
          activo?.tipo_activo
      );
      const descripcion = normalize(activo?.descripcion);
      const ubicacion = normalize(activo?.ubicacion?.completa);

      if (!query) return true;
      return (
        codigo.includes(query) ||
        tipo.includes(query) ||
        descripcion.includes(query) ||
        ubicacion.includes(query)
      );
    });
  }, [bienesConfirmados, query]);

  const notificationItems = useMemo(() => {
    if (!isUsuario) return null;

    return pendientesResguardo.map((item) => ({
      ...item,
      onSubirQR: () => {
        const targetId = item?.activoId ?? item?.id_activo ?? item?.activo?.id_activo;
        if (targetId == null) return;
        navigate(`/confirmar-resguardo/${targetId}`);
      },
    }));
  }, [isUsuario, navigate, pendientesResguardo]);

  const hasPending = isUsuario && pendientesResguardo.length > 0;

  useEffect(() => {
    if (!location.state?.resguardoConfirmedToast) return;
    setShowSuccessToast(true);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  return (
    <div className="inv-page">
      <NavbarMenu
        title="Mis bienes"
        onMenuClick={() => setOpenSidebar((v) => !v)}
        notificationItems={notificationItems}
        onNotificationsOpen={refresh}
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

      <Container fluid className="inv-content px-3 px-md-4 py-3">
        <ToastContainer position="top-end" className="p-3">
          <Toast
            bg="success"
            onClose={() => setShowSuccessToast(false)}
            show={showSuccessToast}
            delay={2600}
            autohide
          >
            <Toast.Body className="text-white fw-semibold">
              Resguardo confirmado correctamente
            </Toast.Body>
          </Toast>
        </ToastContainer>

        {error ? (
          <Alert
            variant="danger"
            className="d-flex align-items-center justify-content-between gap-3"
            dismissible
            onClose={refresh}
          >
            <span>{error}</span>
            <PrimaryButton
              variant="outline-danger"
              label="Reintentar"
              onClick={refresh}
            />
          </Alert>
        ) : null}

        {isLoading ? (
          <Alert variant="info" className="d-flex align-items-center gap-2">
            <Spinner animation="border" size="sm" />
            <span>Cargando tus resguardos...</span>
          </Alert>
        ) : null}

        {hasPending ? (
          <Alert variant="warning" className="mb-3">
            Tienes bienes pendientes por confirmar
          </Alert>
        ) : null}

        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Buscar por código, producto, descripción o ubicación"
        />

        {!isLoading && bienesConfirmados.length === 0 ? (
          <Alert variant="info" className="mt-3">
            {pendientesResguardo.length > 0
              ? "Tienes bienes pendientes por confirmar. Usa la notificación para subir el QR y completar el resguardo."
              : "No tienes bienes confirmados. Si te asignaron un activo, confirma el resguardo desde las notificaciones."}
          </Alert>
        ) : null}

        {!isLoading && bienesConfirmados.length > 0 && activosFiltrados.length === 0 ? (
          <Alert variant="info" className="mt-3">
            No hay bienes confirmados con ese filtro.
          </Alert>
        ) : null}

        {!isLoading && activosFiltrados.length > 0 ? (
          <Row className="g-4 mt-2">
            {activosFiltrados.map((activo, index) => (
              <Col md={4} key={`${activo.id_activo ?? "act"}-${activo.resguardo_id ?? index}`}>
                <AssetCard activo={activo} />
              </Col>
            ))}
          </Row>
        ) : null}
      </Container>
    </div>
  );
}
