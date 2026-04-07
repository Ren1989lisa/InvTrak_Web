import { useMemo, useState } from "react";
import { Alert, Card, Col, Container, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import NavbarMenu from "../Components/NavbarMenu";
import SearchBar from "../Components/SearchBar";
import SidebarMenu from "../Components/SidebarMenu";
import { useUsers } from "../context/UsersContext";
import { getStoredReportes } from "../reportesStorage";
import { getStoredActivos } from "../activosStorage";
import "../Style/bienes-registrados.css";
import "../Style/sidebar.css";

function ReparacionCard({ reporte, activo, onClick }) {
  const producto = activo?.producto ?? {};
  const prioridad = (reporte?.prioridad ?? "").toString().toLowerCase();
  const prioridadColor = prioridad === "alta" ? "danger" : prioridad === "media" ? "warning" : "secondary";

  return (
    <Card
      className="inv-asset-card shadow-sm border-0 h-100"
      onClick={onClick}
      style={{ cursor: "pointer" }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <Card.Header className="inv-asset-card__header d-flex justify-content-between align-items-center">
        <span>
          <span className="inv-asset-card__headerLabel">{reporte?.folio}</span>{" "}
          <span className="inv-asset-card__headerValue">
            {activo?.etiqueta_bien ?? `Activo #${reporte?.id_activo}`}
          </span>
        </span>
        <span className={`badge bg-${prioridadColor}`}>{reporte?.prioridad ?? ""}</span>
      </Card.Header>

      <Card.Body className="inv-asset-card__body">
        <div className="inv-field">
          <span className="inv-field__label">Tipo de activo:</span>
          <span className="inv-field__value">
            {producto?.tipo_activo ?? activo?.tipo_activo ?? "-"}
          </span>
        </div>

        <div className="inv-field inv-field--stack">
          <span className="inv-field__label">Reparar:</span>
          <span className="inv-field__value">{reporte?.descripcion}</span>
        </div>

        <div className="inv-field">
          <span className="inv-field__label">Fecha reporte:</span>
          <span className="inv-field__value">{reporte?.fecha_reporte}</span>
        </div>

        <div className="inv-field">
          <span className="inv-field__label">Estatus:</span>
          <span className="inv-field__value">{reporte?.estatus ?? "pendiente"}</span>
        </div>
      </Card.Body>
    </Card>
  );
}

export default function MisReparaciones() {
  const [search, setSearch] = useState("");
  const [openSidebar, setOpenSidebar] = useState(false);
  const navigate = useNavigate();
  const { currentUser, logout, menuItems } = useUsers();

  const reportes = useMemo(() => getStoredReportes(), []);
  const activos = useMemo(() => getStoredActivos(), []);
  const query = search.trim().toLowerCase();

  const activosMap = useMemo(
    () => new Map(activos.map((a) => [Number(a?.id_activo), a])),
    [activos]
  );

  const misReportes = useMemo(() => {
    const idTecnico = Number(currentUser?.id_usuario);
    return reportes.filter(
      (r) => Number(r?.id_tecnico_asignado) === idTecnico
    );
  }, [reportes, currentUser?.id_usuario]);

  const reportesConActivo = useMemo(() => {
    return misReportes.map((r) => ({
      reporte: r,
      activo: activosMap.get(Number(r?.id_activo)),
    }));
  }, [misReportes, activosMap]);

  const filtrados = useMemo(() => {
    if (!query) return reportesConActivo;
    return reportesConActivo.filter(({ reporte, activo }) => {
      const desc = (reporte?.descripcion ?? "").toLowerCase();
      const codigo = (activo?.etiqueta_bien ?? "").toLowerCase();
      const folio = (reporte?.folio ?? "").toLowerCase();
      return desc.includes(query) || codigo.includes(query) || folio.includes(query);
    });
  }, [reportesConActivo, query]);

  const handleClick = (reporte) => {
    if (reporte?.id_reporte) {
      navigate(`/reporte/${reporte.id_reporte}`);
    }
  };

  return (
    <div className="inv-page">
      <NavbarMenu
        title="Mis reparaciones"
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

      <Container fluid className="inv-content px-3 px-md-4 py-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Buscar por folio, descripción o código"
        />

        {misReportes.length === 0 ? (
          <Alert variant="info" className="mt-3">
            No tienes reportes asignados para reparar. El administrador te asignará mantenimientos cuando haya reportes pendientes.
          </Alert>
        ) : (
          <Row className="g-4 mt-2">
            {filtrados.map(({ reporte, activo }) => (
              <Col md={4} key={reporte?.id_reporte}>
                <ReparacionCard
                  reporte={reporte}
                  activo={activo}
                  onClick={() => handleClick(reporte)}
                />
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </div>
  );
}
