import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Button } from "react-bootstrap";
import NavbarMenu from "../Components/NavbarMenu";
import SidebarMenu from "../Components/SidebarMenu";
import AssetDetailCard from "../Components/AssetDetailCard";
import activosData from "../data/activosDetalle.json";
import usuariosData from "../data/usuarios.json";
import "../Style/bienes-registrados.css";
import "../Style/asset-detail.css";
import "../Style/sidebar.css";

export default function AssetDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [openSidebar, setOpenSidebar] = useState(false);
  const usuarioLogeado = usuariosData[0];
  const activos = Array.isArray(activosData) ? activosData : [];
  const idNum = Number(id);
  const sidebarItems = [
    { icon: "grid", label: "Bienes", route: "/bienes-registrados" },
    { icon: "users", label: "Usuarios", route: "/usuarios" },
    { icon: "box", label: "Activos", route: "/activos" },
    { icon: "folder", label: "Catalogos", route: "/catalogos" },
    { icon: "report", label: "Reportes", route: "/reportes" },
    { icon: "clock", label: "Historial", route: "/historial" },
  ];

  const activo = useMemo(
    () => activos.find((a) => a.id_activo === idNum),
    [activos, idNum]
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
        userName={usuarioLogeado.nombre_completo}
        items={sidebarItems}
        onViewProfile={() => {
          setOpenSidebar(false);
          navigate("/perfil");
        }}
        onLogout={() => {
          setOpenSidebar(false);
          navigate("/");
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
