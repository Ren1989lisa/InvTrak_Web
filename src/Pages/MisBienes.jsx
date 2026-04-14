import { useMemo, useState } from "react";
import { Alert, Container, Row, Col, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import NavbarMenu from "../Components/NavbarMenu";
import SearchBar from "../Components/SearchBar";
import AssetCard from "../Components/AssetCard";
import SidebarMenu from "../Components/SidebarMenu";
import PrimaryButton from "../Components/PrimaryButton";
import { useUsers } from "../context/UsersContext";
import { usePendientesResguardo } from "../hooks/usePendientesResguardo";
import { openQRFilePicker } from "../utils/decodeQRFromFile";
import "../Style/bienes-registrados.css";
import "../Style/sidebar.css";

function normalize(value) {
  return (value ?? "").toString().trim().toLowerCase();
}

export default function MisBienes() {
  const [search, setSearch] = useState("");
  const [openSidebar, setOpenSidebar] = useState(false);
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
  const isUsuario = (currentUser?.rol ?? "")
    .toString()
    .trim()
    .toLowerCase()
    .includes("usuario");

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
    }));
  }, [isUsuario, navigate, pendientesResguardo]);

  const hasPending = isUsuario && pendientesResguardo.length > 0;

  return (
    <div className="inv-page">
      <NavbarMenu
        title="Mis bienes"
        onMenuClick={() => setOpenSidebar((v) => !v)}
        notificationItems={notificationItems}
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
            {activosFiltrados.map((activo) => (
              <Col md={4} key={activo.id_activo}>
                <AssetCard activo={activo} />
              </Col>
            ))}
          </Row>
        ) : null}
      </Container>
    </div>
  );
}
