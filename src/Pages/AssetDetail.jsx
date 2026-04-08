import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Button, Alert } from "react-bootstrap";
import NavbarMenu from "../Components/NavbarMenu";
import SidebarMenu from "../Components/SidebarMenu";
import AssetDetailCard from "../Components/AssetDetailCard";
import { useUsers } from "../context/UsersContext";
import { getStoredActivos, saveActivos } from "../activosStorage";
import { getActivos } from "../services/activoService";
import "../Style/bienes-registrados.css";
import "../Style/asset-detail.css";
import "../Style/sidebar.css";

export default function AssetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [openSidebar, setOpenSidebar] = useState(false);
  const { currentUser, logout, menuItems } = useUsers();
  const [activos, setActivos] = useState(() => getStoredActivos());
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadFromService() {
      setIsLoading(true);
      setLoadError("");
      try {
        const list = await getActivos();
        if (!active) return;
        setActivos(list);
        saveActivos(list);
      } catch {
        if (!active) return;
        setLoadError("No se pudo cargar el detalle desde el servicio. Se muestran datos locales.");
      } finally {
        if (active) setIsLoading(false);
      }
    }
    loadFromService();
    return () => {
      active = false;
    };
  }, []);

  const activo = useMemo(
    () =>
      (Array.isArray(activos) ? activos : []).find(
        (a) =>
          String(a?.id_activo ?? a?.id ?? a?.idActivo ?? "") === String(id ?? "")
      ) ?? null,
    [activos, id]
  );

  return (
    <div className="inv-page inv-page--detail">
      <NavbarMenu
        title="Detalle del activo"
        onMenuClick={() => setOpenSidebar((v) => !v)}
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

      <Container fluid className="inv-content inv-content--detail px-3 px-md-4 py-3">
        <Button
          type="button"
          variant="link"
          className="inv-back-btn"
          onClick={() => navigate(-1)}
        >
          ← Regresar
        </Button>

        {loadError ? (
          <Alert variant="warning" className="mt-2 mb-0">
            {loadError}
          </Alert>
        ) : null}
        {isLoading ? (
          <Alert variant="info" className="mt-2 mb-0">
            Cargando detalle del activo...
          </Alert>
        ) : null}

        {activo ? (
          <Row className="justify-content-center mt-3">
            <Col xs={12} md={10} lg={8}>
              <AssetDetailCard activo={activo} />
            </Col>
          </Row>
        ) : (
          <div className="inv-detail-not-found">
            <p>Activo no encontrado.</p>
            <Button
              type="button"
              variant="primary"
              onClick={() => navigate("/bienes-registrados")}
            >
              Volver a bienes registrados
            </Button>
          </div>
        )}
      </Container>
    </div>
  );
}
