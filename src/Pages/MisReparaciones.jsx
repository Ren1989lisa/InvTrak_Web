import { useMemo, useState } from "react";
import { Alert, Card, Col, Container, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import NavbarMenu from "../Components/NavbarMenu";
import SearchBar from "../Components/SearchBar";
import SidebarMenu from "../Components/SidebarMenu";
import FiltersModal from "../Components/FiltersModal";
import { useUsers } from "../context/UsersContext";
import { getStoredReportes } from "../reportesStorage";
import { getStoredActivos } from "../activosStorage";
import "../Style/bienes-registrados.css";
import "../Style/sidebar.css";

function normalize(value) {
  return (value ?? "").toString().trim().toLowerCase();
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function ReparacionCard({ reporte, activo, onClick }) {
  const producto = activo?.producto ?? {};
  const prioridad = normalize(reporte?.prioridad);
  const prioridadColor =
    prioridad === "alta" ? "danger" : prioridad === "media" ? "warning" : "secondary";

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
  const [showFilters, setShowFilters] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState(null);
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
    return reportes.filter((r) => Number(r?.id_tecnico_asignado) === idTecnico);
  }, [reportes, currentUser?.id_usuario]);

  const reportesConActivo = useMemo(() => {
    return misReportes.map((r) => ({
      reporte: r,
      activo: activosMap.get(Number(r?.id_activo)),
    }));
  }, [misReportes, activosMap]);

  const ubicaciones = useMemo(() => {
    const values = new Map();

    reportesConActivo.forEach(({ activo }) => {
      const campus = String(activo?.ubicacion?.campus ?? "").trim();
      const edificio = String(activo?.ubicacion?.edificio ?? "").trim();
      const aula = String(activo?.ubicacion?.aula ?? "").trim();
      const completa = String(
        activo?.ubicacion?.completa ?? [campus, edificio, aula].filter(Boolean).join(" ")
      )
        .trim()
        .replace(/\s+/g, " ");

      if (!completa) return;

      const key = normalize(completa);
      if (values.has(key)) return;
      values.set(key, {
        campus,
        edificio,
        aula,
        completa,
      });
    });

    return Array.from(values.values());
  }, [reportesConActivo]);

  const filtrados = useMemo(() => {
    return reportesConActivo.filter(({ reporte, activo }) => {
      const desc = normalize(reporte?.descripcion);
      const codigo = normalize(activo?.etiqueta_bien);
      const folio = normalize(reporte?.folio);
      const ubicacion = normalize(activo?.ubicacion?.completa);
      const fecha = parseDate(reporte?.fecha_reporte ?? reporte?.fechaReporte);
      const costo = Number(activo?.costo ?? 0);

      const matchesSearch = !query || desc.includes(query) || codigo.includes(query) || folio.includes(query);
      if (!matchesSearch) return false;

      if (appliedFilters) {
        const { ubicacion: fUbicacion, fechaDesde, fechaHasta, precioMin, precioMax } =
          appliedFilters;

        if (fUbicacion && normalize(activo?.ubicacion?.completa) !== normalize(fUbicacion)) return false;
        if (fechaDesde && fecha && fecha < new Date(fechaDesde)) return false;
        if (fechaHasta && fecha && fecha > new Date(fechaHasta)) return false;
        if (precioMin != null && Number.isFinite(precioMin) && costo < precioMin) return false;
        if (precioMax != null && Number.isFinite(precioMax) && costo > precioMax) return false;
      }

      return true;
    });
  }, [reportesConActivo, query, appliedFilters]);

  const handleClick = (reporte) => {
    if (reporte?.id_reporte) {
      navigate(`/reporte/${reporte.id_reporte}`);
    }
  };

  return (
    <div className="inv-page">
      <NavbarMenu title="Mis reparaciones" onMenuClick={() => setOpenSidebar((v) => !v)} />

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
          onFilters={() => setShowFilters(true)}
          placeholder="Buscar por folio, descripcion o codigo"
        />

        <FiltersModal
          show={showFilters}
          onHide={() => setShowFilters(false)}
          onApply={setAppliedFilters}
          onClear={() => setAppliedFilters(null)}
          ubicaciones={ubicaciones}
        />

        {misReportes.length === 0 ? (
          <Alert variant="info" className="mt-3">
            No tienes reportes asignados para reparar. El administrador te asignara mantenimientos cuando haya reportes pendientes.
          </Alert>
        ) : null}

        {misReportes.length > 0 && filtrados.length === 0 ? (
          <Alert variant="info" className="mt-3">
            No hay reparaciones que coincidan con los filtros.
          </Alert>
        ) : null}

        {filtrados.length > 0 ? (
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
        ) : null}
      </Container>
    </div>
  );
}
